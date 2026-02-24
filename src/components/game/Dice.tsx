import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  value: number | null;
  onRoll?: () => void;
  playerColor?: string;
}

const dots: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
};

const Dice = ({ value, onRoll, playerColor }: Props) => {
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    if (!onRoll) return;
    setIsRolling(true);
    setTimeout(() => {
      setIsRolling(false);
      onRoll();
    }, 450);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        onClick={handleRoll}
        disabled={!onRoll}
        animate={isRolling ? {
          rotateX: [0, 360, 720],
          rotateZ: [0, 90, 0],
          scale: [1, 0.7, 1.1, 1],
        } : {}}
        transition={isRolling ? { duration: 0.45, ease: 'easeInOut' } : {}}
        whileTap={onRoll ? { scale: 0.85 } : undefined}
        whileHover={onRoll ? { scale: 1.1 } : undefined}
        className="relative select-none"
        style={{
          width: 64,
          height: 64,
          borderRadius: 14,
          background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
          border: `3px solid ${onRoll ? (playerColor || '#E53935') : '#999'}`,
          boxShadow: onRoll
            ? `0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px ${playerColor || '#E53935'}33`
            : '0 4px 12px rgba(0,0,0,0.2)',
          cursor: onRoll ? 'pointer' : 'default',
        }}
      >
        {value && !isRolling ? (
          <motion.div
            key={value}
            initial={{ rotateZ: 120, scale: 0.2, opacity: 0 }}
            animate={{ rotateZ: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 350 }}
            className="w-full h-full relative"
          >
            {dots[value].map(([x, y], i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`, top: `${y}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 9, height: 9,
                  backgroundColor: '#1a1a2e',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
                }}
              />
            ))}
          </motion.div>
        ) : !isRolling ? (
          <span className="text-2xl">🎲</span>
        ) : null}
      </motion.button>
      {onRoll && !isRolling && (
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.3 }}
          className="text-[0.6rem] font-bold tracking-widest uppercase"
          style={{ color: playerColor || '#E53935' }}
        >
          Roll
        </motion.span>
      )}
    </div>
  );
};

export default Dice;
