import { motion } from 'framer-motion';

interface Props {
  value: number | null;
  onRoll?: () => void;
}

const dots: Record<number, [number, number][]> = {
  1: [[50,50]],
  2: [[28,28],[72,72]],
  3: [[28,28],[50,50],[72,72]],
  4: [[28,28],[72,28],[28,72],[72,72]],
  5: [[28,28],[72,28],[50,50],[28,72],[72,72]],
  6: [[28,25],[72,25],[28,50],[72,50],[28,75],[72,75]],
};

const Dice = ({ value, onRoll }: Props) => (
  <motion.button
    onClick={onRoll}
    disabled={!onRoll}
    whileTap={onRoll ? { scale: 0.9 } : undefined}
    whileHover={onRoll ? { scale: 1.08 } : undefined}
    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl shadow-lg border-2 transition-colors
      ${onRoll ? 'cursor-pointer bg-white border-primary hover:border-primary/80' : 'cursor-default bg-white/90 border-border'}`}
  >
    {value ? (
      <motion.div
        key={value}
        initial={{ rotateZ: 180, scale: 0.4, opacity: 0 }}
        animate={{ rotateZ: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, type: 'spring' }}
        className="w-full h-full relative"
      >
        {dots[value].map(([x, y], i) => (
          <div
            key={i}
            className="absolute w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full"
            style={{
              left: `${x}%`, top: `${y}%`,
              transform: 'translate(-50%,-50%)',
              backgroundColor: '#1e293b',
            }}
          />
        ))}
      </motion.div>
    ) : (
      <span className="text-2xl">🎲</span>
    )}
    {onRoll && (
      <motion.span
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[0.65rem] text-primary font-medium whitespace-nowrap"
      >
        Tap to roll
      </motion.span>
    )}
  </motion.button>
);

export default Dice;
