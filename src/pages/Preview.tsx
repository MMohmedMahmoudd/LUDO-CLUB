import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GameBoard from '@/components/game/GameBoard';
import { useGameStore } from '@/store/gameStore';

const Preview = () => {
  const nav = useNavigate();
  const { state } = useGameStore();

  // Create a mock state for preview if none exists
  const previewState = state || {
    players: [
      { color: 'red' as const, name: 'Red', isAI: false, tokensFinished: 0 },
      { color: 'green' as const, name: 'Green', isAI: false, tokensFinished: 0 },
      { color: 'blue' as const, name: 'Blue', isAI: false, tokensFinished: 0 },
      { color: 'yellow' as const, name: 'Yellow', isAI: false, tokensFinished: 0 },
    ],
    tokens: {
      red: [
        { id: 0, color: 'red' as const, position: -1 },
        { id: 1, color: 'red' as const, position: -1 },
        { id: 2, color: 'red' as const, position: 5 },
        { id: 3, color: 'red' as const, position: 52 }, // Home stretch start
      ],
      green: [
        { id: 0, color: 'green' as const, position: -1 },
        { id: 1, color: 'green' as const, position: 15 },
        { id: 2, color: 'green' as const, position: -1 },
        { id: 3, color: 'green' as const, position: 53 },
      ],
      blue: [
        { id: 0, color: 'blue' as const, position: -1 },
        { id: 1, color: 'blue' as const, position: 30 },
        { id: 2, color: 'blue' as const, position: -1 },
        { id: 3, color: 'blue' as const, position: 54 },
      ],
      yellow: [
        { id: 0, color: 'yellow' as const, position: -1 },
        { id: 1, color: 'yellow' as const, position: 45 },
        { id: 2, color: 'yellow' as const, position: -1 },
        { id: 3, color: 'yellow' as const, position: 55 },
      ],
    },
    currentPlayerIndex: 0,
    diceValue: null,
    hasRolled: false,
    canRollAgain: false,
    consecutiveSixes: 0,
    gameStatus: 'playing' as const,
    winner: null,
    message: 'Board Preview - Each player has 6 squares in home stretch!',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-950 flex flex-col items-center justify-center p-4">
      <motion.button
        onClick={() => nav('/')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-4 left-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors border border-white/30"
      >
        ← Back
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-2">Ludo Board Preview</h1>
        <p className="text-white/70 text-lg">
          Home stretch configured with <span className="font-bold text-yellow-300">6 squares</span> per player
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[600px]"
      >
        <GameBoard
          state={previewState}
          validMoves={[]}
          onTokenClick={() => {}}
          diceValue={null}
          canRoll={false}
          onRoll={() => {}}
          currentPlayerColor="red"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-md w-full"
      >
        {[
          { color: 'Red', emoji: '🔴', pos: 'Top-Left' },
          { color: 'Green', emoji: '🟢', pos: 'Top-Right' },
          { color: 'Blue', emoji: '🔵', pos: 'Bottom-Right' },
          { color: 'Yellow', emoji: '🟡', pos: 'Bottom-Left' },
        ].map((player) => (
          <div
            key={player.color}
            className="p-4 rounded-lg bg-white/10 border border-white/20 text-center"
          >
            <div className="text-3xl mb-2">{player.emoji}</div>
            <div className="text-white font-semibold text-sm">{player.color}</div>
            <div className="text-white/60 text-xs mt-1">{player.pos}</div>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 px-6 py-4 rounded-lg bg-green-500/20 border border-green-500/50 max-w-md"
      >
        <div className="text-green-300 font-semibold mb-2">✓ Home Stretch Configuration</div>
        <ul className="text-sm text-green-200/80 space-y-1">
          <li>✓ Each player has exactly 6 home stretch squares</li>
          <li>✓ Total game positions: 58 (0-57)</li>
          <li>✓ Main track: 52 squares</li>
          <li>✓ Home stretch: 6 squares per player</li>
          <li>✓ Final position: Safe home (57)</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default Preview;
