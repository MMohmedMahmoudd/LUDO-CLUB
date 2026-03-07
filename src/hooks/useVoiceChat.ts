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

function createRobotProcessor(stream: MediaStream): { processedStream: MediaStream; ctx: AudioContext } {
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);

  // Ring modulator effect for robot voice
  const oscGain = ctx.createGain();
  oscGain.gain.value = 0.6;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 50;
  osc.connect(oscGain);
  osc.start();

  // Waveshaper for distortion
  const waveshaper = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i * 2) / 256 - 1;
    curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
  }
  waveshaper.curve = curve;

  // Bandpass filter for metallic tone
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 1200;
  bandpass.Q.value = 0.8;

  // Second modulator for depth
  const oscGain2 = ctx.createGain();
  oscGain2.gain.value = 0.3;
  const osc2 = ctx.createOscillator();
  osc2.type = 'square';
  osc2.frequency.value = 30;
  osc2.connect(oscGain2);
  osc2.start();

  // Dry/wet mix
  const dryGain = ctx.createGain();
  dryGain.gain.value = 0.4;
  const wetGain = ctx.createGain();
  wetGain.gain.value = 0.7;
  const merger = ctx.createGain();

  // Dry path
  source.connect(dryGain);
  dryGain.connect(merger);

  // Wet path: source → waveshaper → bandpass → wetGain → merger
  source.connect(waveshaper);
  waveshaper.connect(bandpass);
  bandpass.connect(wetGain);
  oscGain.connect(wetGain.gain);
  oscGain2.connect(wetGain.gain);
  wetGain.connect(merger);

  const dest = ctx.createMediaStreamDestination();
  merger.connect(dest);

  return { processedStream: dest.stream, ctx };
}

export function useVoiceChat(roomId: string | null, myProfileId: string | null) {
  const [micOn, setMicOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [robotVoice, setRobotVoice] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);

  const localStream = useRef<MediaStream | null>(null);
  const rawStream = useRef<MediaStream | null>(null);
  const robotCtx = useRef<AudioContext | null>(null);
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

  // Replace the active track on all peer connections
  const replaceTrackOnPeers = useCallback((newTrack: MediaStreamTrack) => {
    peersRef.current.forEach(({ pc }) => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
      if (sender) {
        sender.replaceTrack(newTrack);
      }
    });
  }, []);

  // Build the outgoing stream (raw or robot-processed)
  const applyStream = useCallback((raw: MediaStream, robot: boolean): MediaStream => {
    // Clean up previous robot context
    if (robotCtx.current) {
      robotCtx.current.close();
      robotCtx.current = null;
    }
    if (robot) {
      const { processedStream, ctx } = createRobotProcessor(raw);
      robotCtx.current = ctx;
      return processedStream;
    }
    return raw;
  }, []);

  // Toggle microphone
  const toggleMic = useCallback(async () => {
    if (micOn) {
      // Turn off
      rawStream.current?.getTracks().forEach(t => t.stop());
      localStream.current?.getTracks().forEach(t => t.stop());
      rawStream.current = null;
      localStream.current = null;
      if (robotCtx.current) { robotCtx.current.close(); robotCtx.current = null; }
      peersRef.current.forEach(({ pc }) => {
        pc.getSenders().forEach(sender => {
          if (sender.track) pc.removeTrack(sender);
        });
      });
      setMicOn(false);
    } else {
      try {
        const raw = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        rawStream.current = raw;
        const outStream = applyStream(raw, robotVoice);
        localStream.current = outStream;
        peersRef.current.forEach(({ pc }, peerId) => {
          outStream.getTracks().forEach(track => pc.addTrack(track, outStream));
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
  }, [micOn, myProfileId, robotVoice, applyStream]);

  // Toggle robot voice effect
  const toggleRobot = useCallback(() => {
    const next = !robotVoice;
    setRobotVoice(next);
    if (micOn && rawStream.current) {
      const outStream = applyStream(rawStream.current, next);
      localStream.current = outStream;
      const newTrack = outStream.getAudioTracks()[0];
      if (newTrack) replaceTrackOnPeers(newTrack);
    }
  }, [robotVoice, micOn, applyStream, replaceTrackOnPeers]);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    const next = !speakerOn;
    setSpeakerOn(next);
    peersRef.current.forEach(({ audioEl }) => {
      audioEl.volume = next ? 1 : 0;
    });
  }, [speakerOn]);

  return { micOn, speakerOn, robotVoice, toggleMic, toggleRobot, toggleSpeaker, connectedPeers: peers.length };
}
