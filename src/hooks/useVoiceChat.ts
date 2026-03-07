import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PeerState {
  pc: RTCPeerConnection;
  audioEl: HTMLAudioElement;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useVoiceChat(roomId: string | null, myProfileId: string | null) {
  const [micOn, setMicOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [peers, setPeers] = useState<string[]>([]);

  const localStream = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, PeerState>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const joined = useRef(false);

  const createPeer = useCallback((remotePeerId: string, initiator: boolean) => {
    if (!myProfileId || peersRef.current.has(remotePeerId)) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const audioEl = new Audio();
    audioEl.autoplay = true;

    // Add local tracks if available
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current!);
      });
    }

    // Receive remote audio
    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0] || new MediaStream([e.track]);
      audioEl.volume = speakerOn ? 1 : 0;
    };

    // ICE candidates
    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice',
          payload: { from: myProfileId, to: remotePeerId, candidate: e.candidate.toJSON() },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        removePeer(remotePeerId);
      }
    };

    peersRef.current.set(remotePeerId, { pc, audioEl });
    setPeers(Array.from(peersRef.current.keys()));

    if (initiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        channelRef.current?.send({
          type: 'broadcast',
          event: 'offer',
          payload: { from: myProfileId, to: remotePeerId, sdp: offer },
        });
      });
    }
  }, [myProfileId, speakerOn]);

  const removePeer = useCallback((peerId: string) => {
    const peer = peersRef.current.get(peerId);
    if (peer) {
      peer.pc.close();
      peer.audioEl.srcObject = null;
      peersRef.current.delete(peerId);
      setPeers(Array.from(peersRef.current.keys()));
    }
  }, []);

  // Join the voice channel
  useEffect(() => {
    if (!roomId || !myProfileId) return;

    const channel = supabase.channel(`voice-${roomId}`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        if (payload.peerId !== myProfileId) {
          createPeer(payload.peerId, true);
        }
      })
      .on('broadcast', { event: 'leave' }, ({ payload }) => {
        removePeer(payload.peerId);
      })
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.to !== myProfileId) return;
        createPeer(payload.from, false);
        const peer = peersRef.current.get(payload.from);
        if (!peer) return;
        await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        channel.send({
          type: 'broadcast',
          event: 'answer',
          payload: { from: myProfileId, to: payload.from, sdp: answer },
        });
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.to !== myProfileId) return;
        const peer = peersRef.current.get(payload.from);
        if (!peer) return;
        await peer.pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      })
      .on('broadcast', { event: 'ice' }, async ({ payload }) => {
        if (payload.to !== myProfileId) return;
        const peer = peersRef.current.get(payload.from);
        if (!peer) return;
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch { /* ignore late candidates */ }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && !joined.current) {
          joined.current = true;
          channel.send({
            type: 'broadcast',
            event: 'join',
            payload: { peerId: myProfileId },
          });
        }
      });

    return () => {
      channel.send({
        type: 'broadcast',
        event: 'leave',
        payload: { peerId: myProfileId },
      });
      joined.current = false;
      peersRef.current.forEach((peer) => {
        peer.pc.close();
        peer.audioEl.srcObject = null;
      });
      peersRef.current.clear();
      setPeers([]);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, myProfileId, createPeer, removePeer]);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    if (micOn) {
      localStream.current?.getTracks().forEach(t => t.stop());
      localStream.current = null;
      peersRef.current.forEach(({ pc }) => {
        pc.getSenders().forEach(sender => {
          if (sender.track) pc.removeTrack(sender);
        });
      });
      setMicOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStream.current = stream;
        peersRef.current.forEach(({ pc }, peerId) => {
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
          pc.createOffer().then(offer => {
            pc.setLocalDescription(offer);
            channelRef.current?.send({
              type: 'broadcast',
              event: 'offer',
              payload: { from: myProfileId, to: peerId, sdp: offer },
            });
          });
        });
        setMicOn(true);
      } catch {
        console.warn('Microphone access denied');
      }
    }
  }, [micOn, myProfileId]);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    const next = !speakerOn;
    setSpeakerOn(next);
    peersRef.current.forEach(({ audioEl }) => {
      audioEl.volume = next ? 1 : 0;
    });
  }, [speakerOn]);

  return { micOn, speakerOn, toggleMic, toggleSpeaker, connectedPeers: peers.length };
}
