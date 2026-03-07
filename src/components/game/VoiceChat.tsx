import { motion } from 'framer-motion';
import { useVoiceChat } from '@/hooks/useVoiceChat';

interface Props {
  roomId: string | null;
  myProfileId: string | null;
}

const VoiceChat = ({ roomId, myProfileId }: Props) => {
  const { micOn, speakerOn, toggleMic, toggleSpeaker, connectedPeers } = useVoiceChat(roomId, myProfileId);

  return (
    <div className="flex items-center gap-1.5">
      {/* Mic button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleMic}
        className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all"
        style={{
          background: micOn ? 'rgba(67, 160, 71, 0.25)' : 'rgba(255, 255, 255, 0.08)',
          border: `1.5px solid ${micOn ? 'rgba(67, 160, 71, 0.6)' : 'rgba(255, 255, 255, 0.15)'}`,
        }}
        title={micOn ? 'Mute mic' : 'Unmute mic'}
      >
        {micOn ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#66BB6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        )}
        {/* Live indicator */}
        {micOn && (
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        )}
      </motion.button>

      {/* Speaker button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={toggleSpeaker}
        className="flex items-center justify-center w-9 h-9 rounded-full transition-all"
        style={{
          background: speakerOn ? 'rgba(30, 136, 229, 0.25)' : 'rgba(255, 255, 255, 0.08)',
          border: `1.5px solid ${speakerOn ? 'rgba(30, 136, 229, 0.6)' : 'rgba(255, 255, 255, 0.15)'}`,
        }}
        title={speakerOn ? 'Mute speaker' : 'Unmute speaker'}
      >
        {speakerOn ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#42A5F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        )}
      </motion.button>

      {/* Connected peers count */}
      {connectedPeers > 0 && (
        <span className="text-[10px] text-white/30 ml-0.5">
          {connectedPeers}
        </span>
      )}
    </div>
  );
};

export default VoiceChat;
