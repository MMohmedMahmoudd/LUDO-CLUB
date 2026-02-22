import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import GameBoard from '@/components/game/GameBoard';
import Dice from '@/components/game/Dice';
import PlayerPanel from '@/components/game/PlayerPanel';
import { getAIMove } from '@/lib/game-engine';

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

  // Human auto-skip
  useEffect(() => {
    if (!state || state.gameStatus !== 'playing') return;
    const p = state.players[state.currentPlayerIndex];
    if (p.isAI || !state.hasRolled || validMoves.length > 0) return;
    const t = setTimeout(skipTurn, 1200);
    return () => clearTimeout(t);
  }, [state?.hasRolled, validMoves.length]);

  if (!state) return null;

  const cur = state.players[state.currentPlayerIndex];
  const canRoll = !cur.isAI && !state.hasRolled && state.gameStatus === 'playing';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-3 sm:p-4 gap-3">
      {/* header */}
      <div className="flex items-center w-full max-w-lg">
        <button onClick={() => { resetGame(); nav('/'); }}
          className="text-muted-foreground hover:text-foreground transition-colors text-sm shrink-0">
          ← Menu
        </button>
        <motion.p
          key={state.message}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-foreground text-xs sm:text-sm font-medium text-center flex-1 mx-3"
        >
          {state.message}
        </motion.p>
      </div>

      <GameBoard state={state} validMoves={validMoves} onTokenClick={selectToken} />

      <div className="pt-2">
        <Dice value={state.diceValue} onRoll={canRoll ? rollDice : undefined} />
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {state.players.map(p => (
          <PlayerPanel key={p.color} player={p} isActive={p.color === cur.color}
            tokens={state.tokens[p.color]} />
        ))}
      </div>

      {/* win overlay */}
      <AnimatePresence>
        {state.gameStatus === 'finished' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="bg-card p-8 rounded-2xl text-center max-w-sm w-full border border-border">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-foreground mb-1 capitalize">
                {state.winner} Wins!
              </h2>
              <p className="text-muted-foreground mb-6">Congratulations!</p>
              <div className="flex gap-3">
                <button onClick={() => { resetGame(); nav('/'); }}
                  className="flex-1 py-3 rounded-lg bg-card border border-border text-foreground font-medium">
                  Menu
                </button>
                <button onClick={restartGame}
                  className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
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
