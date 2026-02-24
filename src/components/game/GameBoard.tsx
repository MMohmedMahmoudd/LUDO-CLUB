import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { GameState, PlayerColor } from '@/lib/types';
import {
  MAIN_TRACK, HOME_STRETCH, STAR_POSITIONS, PLAYER_START, HOME_POSITIONS, SAFE_POSITIONS,
} from '@/lib/board-data';
import { getTokenCoordinates, getAbsolutePosition } from '@/lib/game-engine';

interface Props {
  state: GameState;
  validMoves: number[];
  onTokenClick: (id: number) => void;
}

const C: Record<PlayerColor, { main: string; light: string; pale: string; dark: string }> = {
  red:    { main: '#e53935', light: '#ef5350', pale: '#ffcdd2', dark: '#b71c1c' },
  green:  { main: '#43a047', light: '#66bb6a', pale: '#c8e6c9', dark: '#1b5e20' },
  blue:   { main: '#1e88e5', light: '#42a5f5', pale: '#bbdefb', dark: '#0d47a1' },
  yellow: { main: '#fdd835', light: '#ffee58', pale: '#fff9c4', dark: '#f9a825' },
};

const BG = '#F5ECD7';
const BORDER_COLOR = '#D4C9A8';
const BOARD_BG = '#FEFCF5';

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

  // Determine which tiles are valid move destinations for highlighting
  const highlightedCells = useMemo(() => {
    const set = new Set<string>();
    if (!state.hasRolled || !state.diceValue) return set;
    const player = state.players[state.currentPlayerIndex];
    for (const tokenId of validMoves) {
      const token = state.tokens[player.color][tokenId];
      const newPos = token.position === -1 ? 0 : token.position + state.diceValue;
      const [r, c] = (() => {
        if (newPos >= 0 && newPos <= 50) {
          return MAIN_TRACK[getAbsolutePosition(player.color, newPos)];
        }
        if (newPos >= 51 && newPos <= 56) {
          return HOME_STRETCH[player.color][newPos - 51];
        }
        return [7, 7] as [number, number];
      })();
      set.add(`${Math.round(r)},${Math.round(c)}`);
    }
    return set;
  }, [state, validMoves]);

  const isHomeBase = (r: number, c: number): PlayerColor | null => {
    if (r <= 5 && c <= 5) return 'red';
    if (r <= 5 && c >= 9) return 'green';
    if (r >= 9 && c >= 9) return 'blue';
    if (r >= 9 && c <= 5) return 'yellow';
    return null;
  };

  const isInnerHome = (r: number, c: number): boolean => {
    if (r >= 1 && r <= 4 && c >= 1 && c <= 4) return true;
    if (r >= 1 && r <= 4 && c >= 10 && c <= 13) return true;
    if (r >= 10 && r <= 13 && c >= 10 && c <= 13) return true;
    if (r >= 10 && r <= 13 && c >= 1 && c <= 4) return true;
    return false;
  };

  const cellBg = (r: number, c: number): string => {
    const hb = isHomeBase(r, c);
    if (hb) {
      if (isInnerHome(r, c)) return '#FFFFFF';
      return C[hb].main;
    }
    // Center home triangle area
    if (r === 7 && c === 7) return '#FFD700';
    // Center triangles
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
      if (r === 6 && c === 6) return C.red.main;
      if (r === 6 && c === 7) return C.green.main;
      if (r === 6 && c === 8) return C.green.main;
      if (r === 7 && c === 6) return C.red.main;
      if (r === 7 && c === 8) return C.blue.main;
      if (r === 8 && c === 6) return C.yellow.main;
      if (r === 8 && c === 7) return C.yellow.main;
      if (r === 8 && c === 8) return C.blue.main;
    }
    const sc = stretchMap.get(`${r},${c}`);
    if (sc) return C[sc].pale;
    const tp = trackMap.get(`${r},${c}`);
    if (tp !== undefined && startColors[tp]) return C[startColors[tp]].pale;
    return BOARD_BG;
  };

  const pct = (v: number) => `${(v / 15) * 100}%`;

  return (
    <div className="relative aspect-square w-full max-w-[min(90vw,700px)] mx-auto select-none">
      {/* Board grid */}
      <div
        className="grid h-full w-full rounded-2xl overflow-hidden"
        style={{
          gridTemplateColumns: 'repeat(15, 1fr)',
          gridTemplateRows: 'repeat(15, 1fr)',
          border: `4px solid #8B7D5E`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          backgroundColor: BG,
        }}
      >
        {Array.from({ length: 225 }, (_, i) => {
          const r = Math.floor(i / 15), c = i % 15;
          const tp = trackMap.get(`${r},${c}`);
          const isStar = tp !== undefined && STAR_POSITIONS.includes(tp);
          const isSafe = tp !== undefined && SAFE_POSITIONS.includes(tp) && !isStar;
          const isStart = tp !== undefined && startColors[tp] !== undefined;
          const isHighlighted = highlightedCells.has(`${r},${c}`);
          const bg = cellBg(r, c);

          return (
            <div
              key={i}
              className="relative flex items-center justify-center"
              style={{
                backgroundColor: bg,
                border: `0.5px solid ${BORDER_COLOR}`,
                transition: 'background-color 0.2s',
              }}
            >
              {isStar && (
                <span className="text-[0.5rem] sm:text-sm opacity-60" style={{ color: startColors[tp!] ? C[startColors[tp!]].dark : '#888' }}>
                  ★
                </span>
              )}
              {isSafe && !isStart && (
                <span className="text-[0.35rem] sm:text-[0.5rem] opacity-30">★</span>
              )}
              {isStart && !isStar && (
                <span className="text-[0.4rem] sm:text-xs font-bold opacity-40" style={{ color: C[startColors[tp!]].dark }}>
                  ▶
                </span>
              )}
              {isHighlighted && (
                <motion.div
                  className="absolute inset-[15%] rounded-full"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  style={{ backgroundColor: C[cur.color].light }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Center triangle overlay using SVG */}
      <svg
        className="absolute pointer-events-none"
        style={{
          left: pct(6), top: pct(6),
          width: `${(3 / 15) * 100}%`,
          height: `${(3 / 15) * 100}%`,
        }}
        viewBox="0 0 100 100"
      >
        {/* Red triangle - left */}
        <polygon points="0,0 50,50 0,100" fill={C.red.main} />
        {/* Green triangle - top */}
        <polygon points="0,0 100,0 50,50" fill={C.green.main} />
        {/* Blue triangle - right */}
        <polygon points="100,0 100,100 50,50" fill={C.blue.main} />
        {/* Yellow triangle - bottom */}
        <polygon points="0,100 100,100 50,50" fill={C.yellow.main} />
        {/* Center circle */}
        <circle cx="50" cy="50" r="8" fill="#FFD700" stroke="#DAA520" strokeWidth="2" />
      </svg>

      {/* Home position markers (circles in home base) */}
      {state.players.map(p =>
        HOME_POSITIONS[p.color].map(([r, c], i) => (
          <div
            key={`m-${p.color}-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: pct(c), top: pct(r),
              width: '5%', height: '5%',
              marginLeft: '-2.5%', marginTop: '-2.5%',
              border: `2.5px solid ${C[p.color].dark}40`,
              backgroundColor: `${C[p.color].pale}80`,
            }}
          />
        ))
      )}

      {/* Tokens */}
      {state.players.flatMap(p =>
        state.tokens[p.color].map(token => {
          const [r, c] = getTokenCoordinates(p.color, token.id, token.position);
          const valid = p.color === cur.color && validMoves.includes(token.id);
          return (
            <motion.div
              key={`${p.color}-${token.id}`}
              animate={{ left: pct(c), top: pct(r) }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={() => valid && onTokenClick(token.id)}
              className={`absolute flex items-center justify-center rounded-full
                ${valid ? 'cursor-pointer z-20' : 'z-10'}`}
              style={{
                width: '5.2%', height: '5.2%',
                marginLeft: '-2.6%', marginTop: '-2.6%',
                background: `radial-gradient(circle at 35% 35%, ${C[p.color].light}, ${C[p.color].main} 60%, ${C[p.color].dark})`,
                border: `2px solid ${C[p.color].dark}`,
                boxShadow: valid
                  ? `0 0 0 3px ${C[p.color].light}, 0 0 16px ${C[p.color].main}88`
                  : `0 3px 6px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.3)`,
              }}
            >
              <span className="text-white text-[0.4rem] sm:text-[0.6rem] font-bold drop-shadow-md select-none">
                {token.id + 1}
              </span>
              {valid && (
                <motion.div
                  className="absolute inset-[-3px] rounded-full"
                  animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ repeat: Infinity, duration: 0.9 }}
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
