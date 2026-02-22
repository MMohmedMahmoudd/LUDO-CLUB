import { motion } from 'framer-motion';
import { Player, TokenState, PlayerColor } from '@/lib/types';

interface Props {
  player: Player;
  isActive: boolean;
  tokens: TokenState[];
}

const bg: Record<PlayerColor, string> = {
  red: 'bg-game-red', green: 'bg-game-green',
  blue: 'bg-game-blue', yellow: 'bg-game-yellow',
};

const PlayerPanel = ({ player, isActive, tokens }: Props) => {
  const home = tokens.filter(t => t.position === -1).length;
  const track = tokens.filter(t => t.position >= 0 && t.position <= 56).length;
  const done = tokens.filter(t => t.position === 57).length;

  return (
    <motion.div
      animate={isActive ? { scale: 1.05 } : { scale: 1 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors
        ${isActive ? 'border-primary bg-card' : 'border-transparent bg-card/50'}`}
    >
      <div className={`w-3.5 h-3.5 rounded-full ${bg[player.color]}`} />
      <div>
        <span className="text-xs sm:text-sm font-medium text-foreground">
          {player.name}{player.isAI ? ' 🤖' : ''}
        </span>
        <div className="text-[0.6rem] sm:text-xs text-muted-foreground flex gap-1.5">
          <span>🏠{home}</span><span>🏃{track}</span><span>✅{done}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerPanel;
