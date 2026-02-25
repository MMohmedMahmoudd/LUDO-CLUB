import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { GameMode, AILevel } from '@/lib/types';

const Index = () => {
  const [step, setStep] = useState<'menu' | 'settings'>('menu');
  const [mode, setMode] = useState<GameMode>('ai');
  const [count, setCount] = useState(2);
  const [ai, setAi] = useState<AILevel>('medium');
  const nav = useNavigate();
  const init = useGameStore(s => s.initGame);

  const go = (m: GameMode) => { setMode(m); setStep('settings'); };
  const start = () => { init(mode, count, ai); nav('/game'); };

  const sel = (active: boolean) =>
    active
      ? 'bg-primary text-primary-foreground'
      : 'bg-card text-foreground border border-border';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-14"
      >
        <h1 className="text-7xl sm:text-8xl font-black tracking-tighter mb-2">
          <span className="text-game-red">L</span>
          <span className="text-game-blue">U</span>
          <span className="text-game-green">D</span>
          <span className="text-game-yellow">O</span>
        </h1>
        <p className="text-muted-foreground text-lg">The Classic Board Game</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 'menu' ? (
          <motion.div
            key="menu"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex flex-col gap-4 w-full max-w-xs"
          >
            {([['ai', '🤖', 'Play vs AI'], ['local', '👥', 'Local Multiplayer']] as const).map(
              ([m, icon, label]) => (
                <button
                  key={m}
                  onClick={() => go(m as GameMode)}
                  className="w-full py-4 px-6 rounded-xl bg-card border-2 border-border
                    hover:border-primary transition-all text-foreground text-lg font-semibold
                    flex items-center gap-3"
                >
                  <span className="text-2xl">{icon}</span>{label}
                </button>
              ),
            )}
            <button
              onClick={() => nav('/lobby')}
              className="w-full py-4 px-6 rounded-xl border-2 transition-all text-lg font-semibold
                flex items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, #1A237E, #283593)',
                borderColor: '#3949AB',
                color: 'white',
              }}
            >
              <span className="text-2xl">🌐</span>Play Online
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex flex-col gap-6 w-full max-w-xs"
          >
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Players</label>
              <div className="flex gap-2">
                {[2, 3, 4].map(n => (
                  <button key={n} onClick={() => setCount(n)}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${sel(count === n)}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'ai' && (
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">AI Difficulty</label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as AILevel[]).map(l => (
                    <button key={l} onClick={() => setAi(l)}
                      className={`flex-1 py-3 rounded-lg font-semibold capitalize transition-all ${sel(ai === l)}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={start}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground text-lg font-bold
                hover:opacity-90 transition-opacity">
              Start Game 🎲
            </button>
            <button onClick={() => setStep('menu')}
              className="text-muted-foreground text-sm hover:text-foreground transition-colors">
              ← Back
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
