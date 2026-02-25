import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import GameBoard from '@/components/game/GameBoard';
import PlayerPanel from '@/components/game/PlayerPanel';
import { getAIMove } from '@/lib/game-engine';

const PLAYER_COLORS: Record<string, string> = {
  red: '#E53935', green: '#43A047', blue: '#1E88E5', yellow: '#FDD835',
};

const Game = () => {
  const nav = useNavigate();
  const {
    state, validMoves, aiLevel,
    rollDice, selectToken, skipTurn, resetGame, restartGame,
  } = useGameStore();

  useEffect(() => { if (!state) nav('/'); }, [state, nav]);

  // AI auto-play
  useEffect(() => {
    if (!state || state.gameStatus !== 'playing') return;
    const p = state.players[state.currentPlayerIndex];
    if (!p.isAI) return;
    let t: ReturnType<typeof setTimeout>;
    if (!state.hasRolled) {
      t = setTimeout(rollDice, 700);
    } else if (validMoves.length > 0) {
      const m = getAIMove(state, aiLevel);
      t = setTimeout(() => selectToken(m), 700);
    } else {
      t = setTimeout(skipTurn, 700);
    }
    return () => clearTimeout(t);
  }, [state?.currentPlayerIndex, state?.hasRolled, state?.diceValue, validMoves.length]);

  // Human auto-move (single valid token) or auto-skip (no valid tokens)
  useEffect(() => {
    if (!state || state.gameStatus !== 'playing') return;
    const p = state.players[state.currentPlayerIndex];
    if (p.isAI || !state.hasRolled) return;
    if (validMoves.length === 0) {
      const t = setTimeout(skipTurn, 1200);
      return () => clearTimeout(t);
    }
    if (validMoves.length === 1) {
      const t = setTimeout(() => selectToken(validMoves[0]), 400);
      return () => clearTimeout(t);
    }
  }, [state?.hasRolled, validMoves.length]);

  if (!state) return null;

  const cur = state.players[state.currentPlayerIndex];
  const canRoll = !cur.isAI && !state.hasRolled && state.gameStatus === 'playing';
  const curColor = PLAYER_COLORS[cur.color];

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #1B2838 40%, #1A237E 100%)' }}
    >
      {/* Top bar */}
      <div className="flex items-center w-full px-3 py-2">
        <button
          onClick={() => { resetGame(); nav('/'); }}
          className="text-white/60 hover:text-white transition-colors text-xs px-3 py-1.5 rounded-lg hover:bg-white/10 shrink-0"
        >
          ← Menu
        </button>
        <motion.div
          key={state.message}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 flex-1"
        >
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: curColor, boxShadow: `0 0 10px ${curColor}` }}
          />
          <span className="text-white text-xs sm:text-sm font-bold text-center">
            {state.message}
          </span>
        </motion.div>
      </div>

      {/* Player panels - top row */}
      <div className="flex gap-2 justify-center w-full px-3 pb-2">
        {state.players.map(p => (
          <PlayerPanel
            key={p.color}
            player={p}
            isActive={p.color === cur.color}
            tokens={state.tokens[p.color]}
          />
        ))}
      </div>

      {/* Board with integrated dice */}
      <div className="px-1 w-full flex justify-center flex-1">
        <GameBoard
          state={state}
          validMoves={validMoves}
          onTokenClick={selectToken}
          diceValue={state.diceValue}
          canRoll={canRoll}
          onRoll={rollDice}
          currentPlayerColor={cur.color}
        />
      </div>

      {/* Win overlay */}
      <AnimatePresence>
        {state.gameStatus === 'finished' && state.winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.2, rotateZ: -15 }}
              animate={{ scale: 1, rotateZ: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
              className="p-8 rounded-3xl text-center max-w-xs w-full"
              style={{
                background: `linear-gradient(145deg, ${PLAYER_COLORS[state.winner]}25, #0D1B2AEE)`,
                border: `2px solid ${PLAYER_COLORS[state.winner]}66`,
                boxShadow: `0 20px 60px ${PLAYER_COLORS[state.winner]}33, 0 0 80px ${PLAYER_COLORS[state.winner]}11`,
              }}
            >
              <motion.div
                animate={{ rotateZ: [0, -12, 12, -6, 6, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-7xl mb-4"
              >🏆</motion.div>
              <h2 className="text-3xl font-black text-white mb-1 capitalize">
                {state.winner} Wins!
              </h2>
              <p className="text-white/50 text-sm mb-6">Congratulations!</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { resetGame(); nav('/'); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors text-sm"
                >
                  Menu
                </button>
                <button
                  onClick={restartGame}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white transition-colors text-sm"
                  style={{ backgroundColor: PLAYER_COLORS[state.winner] }}
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
