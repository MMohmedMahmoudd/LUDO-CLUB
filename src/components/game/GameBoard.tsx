import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GameState, PlayerColor } from '@/lib/types';
import {
  MAIN_TRACK, HOME_STRETCH, STAR_POSITIONS, PLAYER_START, HOME_POSITIONS,
} from '@/lib/board-data';
import { getTokenCoordinates } from '@/lib/game-engine';

interface Props {
  state: GameState;
  validMoves: number[];
  onTokenClick: (id: number) => void;
}

const C: Record<PlayerColor, { main: string; light: string; pale: string; dark: string }> = {
  red:    { main: '#DC2626', light: '#F87171', pale: '#FEE2E2', dark: '#991B1B' },
  green:  { main: '#16A34A', light: '#4ADE80', pale: '#DCFCE7', dark: '#166534' },
  blue:   { main: '#2563EB', light: '#60A5FA', pale: '#DBEAFE', dark: '#1E3A8A' },
  yellow: { main: '#CA8A04', light: '#FACC15', pale: '#FEF9C3', dark: '#854D0E' },
};

const BG = '#F5ECD7';
const BORDER = '#E8DFC8';

const startColors: Record<number, PlayerColor> = {
  [PLAYER_START.red]: 'red',
  [PLAYER_START.green]: 'green',
  [PLAYER_START.blue]: 'blue',
  [PLAYER_START.yellow]: 'yellow',
};

const GameBoard = ({ state, validMoves, onTokenClick }: Props) => {
  const cur = state.players[state.currentPlayerIndex];

  const trackMap = useMemo(() => {
    const m = new Map<string, number>();
    MAIN_TRACK.forEach(([r, c], i) => m.set(`${r},${c}`, i));
    return m;
  }, []);

  const stretchMap = useMemo(() => {
    const m = new Map<string, PlayerColor>();
    for (const color of ['red','green','blue','yellow'] as PlayerColor[]) {
      HOME_STRETCH[color].forEach(([r, c]) => m.set(`${r},${c}`, color));
    }
    return m;
  }, []);

  const cellBg = (r: number, c: number): string => {
    // home bases
    if (r <= 5 && c <= 5) return (r >= 1 && r <= 4 && c >= 1 && c <= 4) ? '#FFFFFF' : C.red.main;
    if (r <= 5 && c >= 9) return (r >= 1 && r <= 4 && c >= 10 && c <= 13) ? '#FFFFFF' : C.green.main;
    if (r >= 9 && c >= 9) return (r >= 10 && r <= 13 && c >= 10 && c <= 13) ? '#FFFFFF' : C.blue.main;
    if (r >= 9 && c <= 5) return (r >= 10 && r <= 13 && c >= 1 && c <= 4) ? '#FFFFFF' : C.yellow.main;
    // center
    if (r === 7 && c === 7) return '#FFD700';
    const sc = stretchMap.get(`${r},${c}`);
    if (sc) return C[sc].pale;
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
      if (r === 6 && c === 6) return C.red.light;
      if (r === 6 && c === 8) return C.green.light;
      if (r === 8 && c === 8) return C.blue.light;
      if (r === 8 && c === 6) return C.yellow.light;
    }
    // track
    const tp = trackMap.get(`${r},${c}`);
    if (tp !== undefined && startColors[tp]) return C[startColors[tp]].pale;
    return BG;
  };

  const pct = (v: number) => `${(v / 15) * 100}%`;

  return (
    <div className="relative aspect-square w-full max-w-[min(90vw,480px)] mx-auto select-none">
      {/* grid */}
      <div
        className="grid h-full w-full rounded-xl overflow-hidden shadow-2xl"
        style={{
          gridTemplateColumns: 'repeat(15, 1fr)',
          gridTemplateRows: 'repeat(15, 1fr)',
          border: `3px solid #C4B896`,
        }}
      >
        {Array.from({ length: 225 }, (_, i) => {
          const r = Math.floor(i / 15), c = i % 15;
          const tp = trackMap.get(`${r},${c}`);
          const isStar = tp !== undefined && STAR_POSITIONS.includes(tp);
          const isStart = tp !== undefined && startColors[tp] !== undefined;
          return (
            <div
              key={i}
              className="relative flex items-center justify-center"
              style={{ backgroundColor: cellBg(r, c), border: `0.5px solid ${BORDER}` }}
            >
              {isStar && <span className="text-[0.45rem] sm:text-xs opacity-50">★</span>}
              {isStart && !isStar && <span className="text-[0.35rem] sm:text-[0.5rem] opacity-30">▶</span>}
            </div>
          );
        })}
      </div>

      {/* home position markers */}
      {state.players.map(p =>
        HOME_POSITIONS[p.color].map(([r, c], i) => (
          <div
            key={`m-${p.color}-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: pct(c), top: pct(r),
              width: '5.6%', height: '5.6%',
              marginLeft: '-2.8%', marginTop: '-2.8%',
              border: `2px solid ${C[p.color].main}40`,
            }}
          />
        ))
      )}

      {/* tokens */}
      {state.players.flatMap(p =>
        state.tokens[p.color].map(token => {
          const [r, c] = getTokenCoordinates(p.color, token.id, token.position);
          const valid = p.color === cur.color && validMoves.includes(token.id);
          return (
            <motion.div
              key={`${p.color}-${token.id}`}
              animate={{ left: pct(c), top: pct(r) }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={() => valid && onTokenClick(token.id)}
              className={`absolute flex items-center justify-center rounded-full
                ${valid ? 'cursor-pointer z-20' : 'z-10'}`}
              style={{
                width: '5.6%', height: '5.6%',
                marginLeft: '-2.8%', marginTop: '-2.8%',
                backgroundColor: C[p.color].main,
                border: `2px solid ${C[p.color].dark}`,
                boxShadow: valid
                  ? `0 0 0 3px ${C[p.color].light}, 0 0 12px ${C[p.color].main}`
                  : '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              <span className="text-white text-[0.45rem] sm:text-xs font-bold drop-shadow-sm">
                {token.id + 1}
              </span>
              {valid && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  style={{ border: `2px solid ${C[p.color].light}` }}
                />
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
};

export default GameBoard;
