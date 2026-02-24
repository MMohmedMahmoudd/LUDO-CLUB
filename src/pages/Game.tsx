import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import GameBoard from '@/components/game/GameBoard';
import Dice from '@/components/game/Dice';
import PlayerPanel from '@/components/game/PlayerPanel';
import { getAIMove } from '@/lib/game-engine';

const PLAYER_COLORS: Record<string, string> = {
  red: '#e53935', green: '#43a047', blue: '#1e88e5', yellow: '#fdd835',
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
  const curColor = PLAYER_COLORS[cur.color];

  return (
    <div className="min-h-screen flex flex-col items-center p-3 sm:p-4 gap-3">
      {/* Turn indicator */}
      <div className="flex items-center w-full max-w-[700px]">
        <button onClick={() => { resetGame(); nav('/'); }}
          className="text-muted-foreground hover:text-foreground transition-colors text-sm shrink-0 px-3 py-1.5 rounded-lg hover:bg-secondary">
          ← Menu
        </button>
        <motion.div
          key={state.message}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 flex-1 mx-3"
        >
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{
              backgroundColor: curColor,
              boxShadow: `0 0 8px ${curColor}88`,
            }}
          />
          <span className="text-foreground text-xs sm:text-sm font-semibold text-center">
            {state.message}
          </span>
        </motion.div>
      </div>

      <GameBoard state={state} validMoves={validMoves} onTokenClick={selectToken} />

      <div className="pt-1">
        <Dice
          value={state.diceValue}
          onRoll={canRoll ? rollDice : undefined}
          playerColor={curColor}
        />
      </div>

      <div className="flex gap-2 flex-wrap justify-center max-w-[700px]">
        {state.players.map(p => (
          <PlayerPanel key={p.color} player={p} isActive={p.color === cur.color}
            tokens={state.tokens[p.color]} />
        ))}
      </div>

      {/* Win overlay */}
      <AnimatePresence>
        {state.gameStatus === 'finished' && state.winner && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.3, rotateZ: -10 }}
              animate={{ scale: 1, rotateZ: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="p-8 rounded-3xl text-center max-w-sm w-full border"
              style={{
                background: `linear-gradient(135deg, ${PLAYER_COLORS[state.winner]}15, rgba(30,30,50,0.95))`,
                borderColor: `${PLAYER_COLORS[state.winner]}44`,
                boxShadow: `0 20px 60px ${PLAYER_COLORS[state.winner]}33`,
              }}
            >
              <motion.div
                animate={{ rotateZ: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-7xl mb-4"
              >
                🏆
              </motion.div>
              <h2 className="text-3xl font-black text-foreground mb-1 capitalize">
                {state.winner} Wins!
              </h2>
              <p className="text-muted-foreground mb-6">Congratulations!</p>
              <div className="flex gap-3">
                <button onClick={() => { resetGame(); nav('/'); }}
                  className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold border border-border hover:bg-muted transition-colors">
                  Menu
                </button>
                <button onClick={restartGame}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition-colors"
                  style={{ backgroundColor: PLAYER_COLORS[state.winner] }}>
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
