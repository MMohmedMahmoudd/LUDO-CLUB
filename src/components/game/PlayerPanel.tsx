import { motion } from 'framer-motion';
import { Player, TokenState, PlayerColor } from '@/lib/types';

interface Props {
  player: Player;
  isActive: boolean;
  tokens: TokenState[];
}

const colors: Record<PlayerColor, { main: string; light: string; dark: string }> = {
  red:    { main: '#E53935', light: '#EF5350', dark: '#B71C1C' },
  green:  { main: '#43A047', light: '#66BB6A', dark: '#1B5E20' },
  blue:   { main: '#1E88E5', light: '#42A5F5', dark: '#0D47A1' },
  yellow: { main: '#FDD835', light: '#FFEE58', dark: '#F57F17' },
};

const PlayerPanel = ({ player, isActive, tokens }: Props) => {
  const done = tokens.filter(t => t.position === 57).length;
  const c = colors[player.color];

  return (
    <motion.div
      animate={isActive ? { scale: 1.08, y: -2 } : { scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs sm:text-sm"
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${c.dark}CC, ${c.main}AA)`
          : 'rgba(255,255,255,0.08)',
        border: isActive ? `2px solid ${c.light}` : '2px solid rgba(255,255,255,0.1)',
        boxShadow: isActive ? `0 4px 20px ${c.main}44` : 'none',
        minWidth: 'auto',
      }}
    >
      {/* Avatar */}
      <div
        className="w-6 sm:w-8 h-6 sm:h-8 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shrink-0"
        style={{
          background: `linear-gradient(135deg, ${c.light}, ${c.dark})`,
          boxShadow: `0 2px 6px ${c.dark}88`,
          border: `2px solid ${c.light}66`,
        }}
      >
        {player.name[0]}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] sm:text-xs font-bold text-white flex items-center gap-1">
          <span className="hidden sm:inline">{player.name}</span>
          <span className="sm:hidden">{player.name[0]}</span>
          {player.isAI && <span className="opacity-50 text-[10px]">🤖</span>}
        </div>
        {/* Token progress as mini circles */}
        <div className="flex gap-0.5 sm:gap-1 mt-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 5, height: 5,
                backgroundColor: i < done ? '#FFD700' : `${c.main}55`,
                border: i < done ? '0.5px solid #DAA520' : `0.5px solid ${c.main}33`,
                boxShadow: i < done ? '0 0 4px #FFD70088' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerPanel;
