import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { GameMode, AILevel, TokenShape, PlayerColor } from '@/lib/types';
import { ALL_TOKEN_SHAPES, TOKEN_SHAPES, TOKEN_SHAPE_LABELS } from '@/lib/token-shapes';

const ALL_COLORS: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
const COLOR_HEX: Record<PlayerColor, string> = {
  red: '#E53935', green: '#43A047', blue: '#1E88E5', yellow: '#FDD835',
};
const COLOR_LABELS: Record<PlayerColor, string> = {
  red: 'Red', green: 'Green', blue: 'Blue', yellow: 'Yellow',
};

const Index = () => {
  const [step, setStep] = useState<'menu' | 'settings' | 'customize'>('menu');
  const [mode, setMode] = useState<GameMode>('ai');
  const [count, setCount] = useState(2);
  const [ai, setAi] = useState<AILevel>('medium');
  const [playerColors, setPlayerColors] = useState<PlayerColor[]>(['red', 'green']);
  const [playerShapes, setPlayerShapes] = useState<Record<number, TokenShape>>({ 0: 'circle', 1: 'circle' });
  const [editingShape, setEditingShape] = useState<number | null>(null);
  const nav = useNavigate();
  const init = useGameStore(s => s.initGame);

  const go = (m: GameMode) => { setMode(m); setStep('settings'); };
  const start = () => {
    init(mode, playerColors, ai, playerShapes[0] ?? 'circle', playerShapes);
    nav('/game');
  };

  // Update playerColors when count changes
  const updateCount = (n: number) => {
    setCount(n);
    const current = playerColors.slice(0, n);
    while (current.length < n) {
      const next = ALL_COLORS.find(c => !current.includes(c));
      if (next) current.push(next);
    }
    setPlayerColors(current);
    // Ensure shapes exist for new players
    setPlayerShapes(prev => {
      const next = { ...prev };
      for (let i = 0; i < n; i++) {
        if (!(i in next)) next[i] = 'circle';
      }
      return next;
    });
  };

  const setPlayerColor = (playerIdx: number, color: PlayerColor) => {
    setPlayerColors(prev => {
      const next = [...prev];
      // If another player already has this color, swap
      const existingIdx = next.indexOf(color);
      if (existingIdx !== -1 && existingIdx !== playerIdx) {
        next[existingIdx] = next[playerIdx];
      }
      next[playerIdx] = color;
      return next;
    });
  };

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
            <button
              onClick={() => nav('/preview')}
              className="w-full py-4 px-6 rounded-xl bg-card border-2 border-border
                hover:border-primary transition-all text-foreground text-lg font-semibold
                flex items-center gap-3"
            >
              <span className="text-2xl">👁️</span>View Board Preview
            </button>
          </motion.div>
        ) : step === 'settings' ? (
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
                  <button key={n} onClick={() => updateCount(n)}
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

            <button onClick={() => setStep('customize')}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground text-lg font-bold
                hover:opacity-90 transition-opacity">
              Customize Players →
            </button>
            <button onClick={() => setStep('menu')}
              className="text-muted-foreground text-sm hover:text-foreground transition-colors">
              ← Back
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="customize"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex flex-col gap-5 w-full max-w-sm"
          >
            <label className="text-sm text-muted-foreground block text-center">
              Choose Color & Shape for Each Player
            </label>
            <div className="flex flex-col gap-3">
              {playerColors.map((color, idx) => (
                <div
                  key={idx}
                  className="rounded-xl p-3 border-2 transition-all"
                  style={{
                    borderColor: `${COLOR_HEX[color]}88`,
                    background: `${COLOR_HEX[color]}10`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLOR_HEX[color] }}
                    />
                    <span className="text-xs font-bold text-white flex-1">
                      {mode === 'ai' && idx > 0 ? `AI ${idx}` : `Player ${idx + 1}`}
                    </span>
                    <button
                      onClick={() => setEditingShape(editingShape === idx ? null : idx)}
                      className="text-lg px-1 rounded hover:bg-white/10 transition-colors"
                      title="Change shape"
                    >
                      {TOKEN_SHAPES[playerShapes[idx] ?? 'circle']}
                    </button>
                  </div>
                  {/* Color selection row */}
                  <div className="flex gap-1.5">
                    {ALL_COLORS.map(c => {
                      const isSelected = color === c;
                      return (
                        <button
                          key={c}
                          onClick={() => setPlayerColor(idx, c)}
                          className="flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all border-2 flex flex-col items-center gap-0.5"
                          style={{
                            backgroundColor: isSelected ? COLOR_HEX[c] : 'transparent',
                            borderColor: isSelected ? COLOR_HEX[c] : `${COLOR_HEX[c]}55`,
                            color: isSelected ? '#fff' : COLOR_HEX[c],
                          }}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLOR_HEX[c] }}
                          />
                          {COLOR_LABELS[c]}
                        </button>
                      );
                    })}
                  </div>
                  {/* Shape picker (expandable) */}
                  <AnimatePresence>
                    {editingShape === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-4 gap-1.5 mt-2 pt-2 border-t border-white/10">
                          {ALL_TOKEN_SHAPES.map(shape => (
                            <button
                              key={shape}
                              onClick={() => {
                                setPlayerShapes(prev => ({ ...prev, [idx]: shape }));
                                setEditingShape(null);
                              }}
                              className={`py-2 px-1 rounded-lg transition-all border flex flex-col items-center gap-0.5
                                ${(playerShapes[idx] ?? 'circle') === shape
                                  ? 'border-white/50 bg-white/15'
                                  : 'border-transparent hover:bg-white/10'
                                }`}
                            >
                              <span className="text-xl">{TOKEN_SHAPES[shape]}</span>
                              <span className="text-[9px] text-white/60">{TOKEN_SHAPE_LABELS[shape]}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <button onClick={start}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground text-lg font-bold
                hover:opacity-90 transition-opacity">
              Start Game 🎲
            </button>
            <button onClick={() => setStep('settings')}
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
