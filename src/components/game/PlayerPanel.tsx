import { motion } from 'framer-motion';
import { Player, TokenState, PlayerColor } from '@/lib/types';

interface Props {
  player: Player;
  isActive: boolean;
  tokens: TokenState[];
}

const colors: Record<PlayerColor, { main: string; light: string; dark: string }> = {
  red:    { main: '#e53935', light: '#ef5350', dark: '#b71c1c' },
  green:  { main: '#43a047', light: '#66bb6a', dark: '#1b5e20' },
  blue:   { main: '#1e88e5', light: '#42a5f5', dark: '#0d47a1' },
  yellow: { main: '#fdd835', light: '#ffee58', dark: '#f9a825' },
};

const PlayerPanel = ({ player, isActive, tokens }: Props) => {
  const home = tokens.filter(t => t.position === -1).length;
  const done = tokens.filter(t => t.position === 57).length;
  const c = colors[player.color];

  return (
    <motion.div
      animate={isActive ? { scale: 1.05, y: -2 } : { scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${c.main}22, ${c.main}11)`
          : 'rgba(255,255,255,0.05)',
        border: isActive ? `2px solid ${c.main}` : '2px solid transparent',
        boxShadow: isActive ? `0 4px 16px ${c.main}33` : 'none',
      }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{
          background: `linear-gradient(135deg, ${c.light}, ${c.main})`,
          boxShadow: `0 2px 8px ${c.main}55`,
        }}
      >
        {player.name[0]}
      </div>
      <div className="min-w-0">
        <div className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
          {player.name}
          {player.isAI && <span className="text-[0.6rem] opacity-60">🤖</span>}
        </div>
        <div className="flex gap-2 text-[0.6rem] sm:text-xs text-muted-foreground">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
              style={{
                backgroundColor: i < done ? c.main : i < (4 - home) ? `${c.main}55` : `${c.main}22`,
                border: `1px solid ${c.main}44`,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerPanel;
