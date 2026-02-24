import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  value: number | null;
  onRoll?: () => void;
  playerColor?: string;
}

const dots: Record<number, [number, number][]> = {
  1: [[50,50]],
  2: [[30,30],[70,70]],
  3: [[30,30],[50,50],[70,70]],
  4: [[30,30],[70,30],[30,70],[70,70]],
  5: [[30,30],[70,30],[50,50],[30,70],[70,70]],
  6: [[30,22],[70,22],[30,50],[70,50],[30,78],[70,78]],
};

const Dice = ({ value, onRoll, playerColor }: Props) => {
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    if (!onRoll) return;
    setIsRolling(true);
    setTimeout(() => {
      setIsRolling(false);
      onRoll();
    }, 400);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        onClick={handleRoll}
        disabled={!onRoll}
        animate={isRolling ? {
          rotateX: [0, 360, 720],
          rotateZ: [0, 180, 360],
          scale: [1, 0.8, 1],
        } : {}}
        transition={isRolling ? { duration: 0.4, ease: 'easeInOut' } : {}}
        whileTap={onRoll ? { scale: 0.88 } : undefined}
        whileHover={onRoll ? { scale: 1.08, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' } : undefined}
        className="relative rounded-2xl select-none"
        style={{
          width: 72,
          height: 72,
          background: 'linear-gradient(145deg, #ffffff, #e8e8e8)',
          border: onRoll ? `3px solid ${playerColor || '#e53935'}` : '3px solid #ccc',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.8)',
          cursor: onRoll ? 'pointer' : 'default',
        }}
      >
        {value && !isRolling ? (
          <motion.div
            key={value}
            initial={{ rotateZ: 90, scale: 0.3, opacity: 0 }}
            animate={{ rotateZ: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
            className="w-full h-full relative"
          >
            {dots[value].map(([x, y], i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`, top: `${y}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 10, height: 10,
                  backgroundColor: '#1a1a2e',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
                }}
              />
            ))}
          </motion.div>
        ) : !isRolling ? (
          <span className="text-3xl">🎲</span>
        ) : null}
      </motion.button>
      {onRoll && !isRolling && (
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-[0.65rem] font-semibold tracking-wide uppercase"
          style={{ color: playerColor || '#e53935' }}
        >
          Tap to roll
        </motion.span>
      )}
    </div>
  );
};

export default Dice;
