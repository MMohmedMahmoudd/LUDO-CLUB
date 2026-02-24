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

const C: Record<PlayerColor, { main: string; light: string; dark: string; track: string }> = {
  red:    { main: '#E53935', light: '#EF5350', dark: '#B71C1C', track: '#FFCDD2' },
  green:  { main: '#43A047', light: '#66BB6A', dark: '#1B5E20', track: '#C8E6C9' },
  blue:   { main: '#1E88E5', light: '#42A5F5', dark: '#0D47A1', track: '#BBDEFB' },
  yellow: { main: '#FDD835', light: '#FFEE58', dark: '#F57F17', track: '#FFF9C4' },
};

const BOARD_FRAME = '#1A237E';
const BOARD_BG = '#E8E0CC';
const CELL_BORDER = '#C5B99A';

const startColors: Record<number, PlayerColor> = {
  [PLAYER_START.red]: 'red',
  [PLAYER_START.green]: 'green',
  [PLAYER_START.blue]: 'blue',
  [PLAYER_START.yellow]: 'yellow',
};

/* Offsets when multiple tokens share a cell */
const STACK_OFFSETS: [number, number][] = [
  [0, 0],
  [-0.35, -0.35],
  [0.35, -0.35],
  [-0.35, 0.35],
];
const STACK_OFFSETS_2: [number, number][] = [
  [-0.25, -0.25],
  [0.25, 0.25],
];
const STACK_OFFSETS_3: [number, number][] = [
  [-0.3, -0.2],
  [0.3, -0.2],
  [0, 0.3],
];

function getStackOffset(count: number, index: number): [number, number] {
  if (count <= 1) return [0, 0];
  if (count === 2) return STACK_OFFSETS_2[index] || [0, 0];
  if (count === 3) return STACK_OFFSETS_3[index] || [0, 0];
  return STACK_OFFSETS[index] || [0, 0];
}

const GameBoard = ({ state, validMoves, onTokenClick }: Props) => {
  const cur = state.players[state.currentPlayerIndex];

  const trackMap = useMemo(() => {
    const m = new Map<string, number>();
    MAIN_TRACK.forEach(([r, c], i) => m.set(`${r},${c}`, i));
    return m;
  }, []);

  const stretchMap = useMemo(() => {
    const m = new Map<string, PlayerColor>();
    for (const color of ['red', 'green', 'blue', 'yellow'] as PlayerColor[]) {
      HOME_STRETCH[color].forEach(([r, c]) => m.set(`${r},${c}`, color));
    }
    return m;
  }, []);

  const highlightedCells = useMemo(() => {
    const set = new Set<string>();
    if (!state.hasRolled || !state.diceValue) return set;
    const player = state.players[state.currentPlayerIndex];
    for (const tokenId of validMoves) {
      const token = state.tokens[player.color][tokenId];
      const newPos = token.position === -1 ? 0 : token.position + state.diceValue;
      if (newPos >= 0 && newPos <= 50) {
        const [r, c] = MAIN_TRACK[getAbsolutePosition(player.color, newPos)];
        set.add(`${r},${c}`);
      } else if (newPos >= 51 && newPos <= 56) {
        const [r, c] = HOME_STRETCH[player.color][newPos - 51];
        set.add(`${r},${c}`);
      } else {
        set.add('7,7');
      }
    }
    return set;
  }, [state, validMoves]);

  /* Group tokens by their coordinate to handle stacking */
  const tokenGroups = useMemo(() => {
    const groups = new Map<string, { color: PlayerColor; tokenId: number; position: number; r: number; c: number }[]>();
    for (const p of state.players) {
      for (const token of state.tokens[p.color]) {
        const [r, c] = getTokenCoordinates(p.color, token.id, token.position);
        // Round to 1 decimal to group tokens at same logical cell
        const key = `${r.toFixed(1)},${c.toFixed(1)}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push({ color: p.color, tokenId: token.id, position: token.position, r, c });
      }
    }
    return groups;
  }, [state.tokens, state.players]);

  const quadrantColor = (r: number, c: number): PlayerColor | null => {
    if (r <= 5 && c <= 5) return 'red';
    if (r <= 5 && c >= 9) return 'green';
    if (r >= 9 && c >= 9) return 'blue';
    if (r >= 9 && c <= 5) return 'yellow';
    return null;
  };

  const isInnerHome = (r: number, c: number): boolean => {
    return (r >= 1 && r <= 4 && c >= 1 && c <= 4) ||
           (r >= 1 && r <= 4 && c >= 10 && c <= 13) ||
           (r >= 10 && r <= 13 && c >= 10 && c <= 13) ||
           (r >= 10 && r <= 13 && c >= 1 && c <= 4);
  };

  const cellBg = (r: number, c: number): string => {
    const quad = quadrantColor(r, c);
    if (quad) {
      if (isInnerHome(r, c)) return '#FFFFFF';
      return C[quad].main;
    }
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return 'transparent';
    const sc = stretchMap.get(`${r},${c}`);
    if (sc) return C[sc].main;
    const tp = trackMap.get(`${r},${c}`);
    if (tp !== undefined && startColors[tp]) return C[startColors[tp]].track;
    if (tp !== undefined && STAR_POSITIONS.includes(tp)) return '#F5ECD7';
    return BOARD_BG;
  };

  /* Convert grid coordinate to percentage for absolute positioning.
     +0.5 to center in the cell (each cell is 1/15 of the board). */
  const pctX = (col: number) => `${((col + 0.5) / 15) * 100}%`;
  const pctY = (row: number) => `${((row + 0.5) / 15) * 100}%`;

  /* For home positions which are already fractional and meant to be cell-centers,
     we use the raw coordinate mapped to the grid. Home positions like 1.5 mean
     "center of cell at index 1-2 area". The board-data stores them as center coords
     in the 0-14 grid space already. */
  const pctRaw = (v: number) => `${(v / 15) * 100}%`;

  /* Token size as percentage of board */
  const TOKEN_SIZE = '5.8%';
  const TOKEN_SIZE_STACKED = '4.6%';

  return (
    <div className="relative aspect-square w-full max-w-[min(90vw,520px)] mx-auto select-none">
      {/* Board with dark blue frame */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: BOARD_FRAME,
          padding: 6,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="grid h-full w-full rounded-xl overflow-hidden"
          style={{
            gridTemplateColumns: 'repeat(15, 1fr)',
            gridTemplateRows: 'repeat(15, 1fr)',
            backgroundColor: BOARD_BG,
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
            const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;

            return (
              <div
                key={i}
                className="relative flex items-center justify-center"
                style={{
                  backgroundColor: isCenter ? 'transparent' : bg,
                  border: isCenter ? 'none' : `0.5px solid ${CELL_BORDER}40`,
                }}
              >
                {isStar && (
                  <span className="text-[0.55rem] sm:text-sm text-white drop-shadow-md"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>★</span>
                )}
                {isSafe && !isStart && (
                  <span className="text-[0.4rem] sm:text-xs opacity-40">★</span>
                )}
                {isStart && !isStar && (
                  <span className="text-[0.4rem] sm:text-xs opacity-50"
                    style={{ color: C[startColors[tp!]].dark }}>▶</span>
                )}
                {isHighlighted && (
                  <motion.div
                    className="absolute inset-[12%] rounded-full"
                    animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    style={{ backgroundColor: C[cur.color].light, boxShadow: `0 0 8px ${C[cur.color].main}` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Center triangles SVG */}
      <svg
        className="absolute pointer-events-none z-[5]"
        style={{
          left: `${(6 / 15) * 100}%`,
          top: `${(6 / 15) * 100}%`,
          width: `${(3 / 15) * 100}%`,
          height: `${(3 / 15) * 100}%`,
        }}
        viewBox="0 0 100 100"
      >
        <polygon points="0,0 50,50 0,100" fill={C.red.main} stroke={C.red.dark} strokeWidth="1" />
        <polygon points="0,0 100,0 50,50" fill={C.green.main} stroke={C.green.dark} strokeWidth="1" />
        <polygon points="100,0 100,100 50,50" fill={C.blue.main} stroke={C.blue.dark} strokeWidth="1" />
        <polygon points="0,100 100,100 50,50" fill={C.yellow.main} stroke={C.yellow.dark} strokeWidth="1" />
        <polygon points="35,35 65,35 65,65 35,65" fill="white" stroke="#ddd" strokeWidth="0.5" />
      </svg>

      {/* Home position markers */}
      {state.players.map(p =>
        HOME_POSITIONS[p.color].map(([r, c], i) => (
          <div
            key={`m-${p.color}-${i}`}
            className="absolute rounded-full pointer-events-none z-[2]"
            style={{
              left: pctRaw(c), top: pctRaw(r),
              width: '4.8%', height: '4.8%',
              transform: 'translate(-50%, -50%)',
              border: `2px dashed ${C[p.color].main}55`,
              backgroundColor: `${C[p.color].main}10`,
            }}
          />
        ))
      )}

      {/* Tokens - pawn style, with stacking */}
      {Array.from(tokenGroups.values()).flatMap(group => {
        const count = group.length;
        return group.map((tok, idx) => {
          const valid = tok.color === cur.color && validMoves.includes(tok.tokenId);
          const isHome = tok.position === -1;
          const offset = getStackOffset(count, idx);
          const size = count > 1 && !isHome ? TOKEN_SIZE_STACKED : TOKEN_SIZE;

          // For home positions (fractional), use raw mapping
          // For track positions (integer grid cells), center in cell with +0.5
          const isGridCell = Number.isInteger(tok.r) && Number.isInteger(tok.c);

          const leftPos = isGridCell ? pctX(tok.c) : pctRaw(tok.c);
          const topPos = isGridCell ? pctY(tok.r) : pctRaw(tok.r);

          return (
            <motion.div
              key={`${tok.color}-${tok.tokenId}`}
              animate={{
                left: leftPos,
                top: topPos,
                x: `calc(-50% + ${offset[1] * 12}px)`,
                y: `calc(-50% + ${offset[0] * 12}px)`,
              }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              onClick={() => valid && onTokenClick(tok.tokenId)}
              className={`absolute z-[10] ${valid ? 'cursor-pointer z-[20]' : ''}`}
              style={{ width: size, height: size }}
            >
              {/* Pawn shape SVG */}
              <svg viewBox="0 0 40 52" className="w-full h-full drop-shadow-lg" style={{
                filter: valid
                  ? `drop-shadow(0 0 6px ${C[tok.color].light}) drop-shadow(0 0 12px ${C[tok.color].main}88)`
                  : 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
              }}>
                {/* Base */}
                <ellipse cx="20" cy="48" rx="14" ry="4"
                  fill={C[tok.color].dark} />
                {/* Body */}
                <path
                  d="M8,46 C8,34 6,28 12,22 C12,22 10,18 10,14 C10,6 14,2 20,2 C26,2 30,6 30,14 C30,18 28,22 28,22 C34,28 32,34 32,46 Z"
                  fill={`url(#pawnGrad-${tok.color})`}
                  stroke={C[tok.color].dark}
                  strokeWidth="1.5"
                />
                {/* Head highlight */}
                <circle cx="20" cy="13" r="6.5"
                  fill={C[tok.color].light}
                  stroke={C[tok.color].dark}
                  strokeWidth="1" />
                <circle cx="18" cy="11" r="2.5"
                  fill="rgba(255,255,255,0.5)" />
                {/* Gradient defs */}
                <defs>
                  <linearGradient id={`pawnGrad-${tok.color}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={C[tok.color].light} />
                    <stop offset="50%" stopColor={C[tok.color].main} />
                    <stop offset="100%" stopColor={C[tok.color].dark} />
                  </linearGradient>
                </defs>
              </svg>
              {/* Pulse ring for valid moves */}
              {valid && (
                <motion.div
                  className="absolute inset-[-4px] rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  style={{ border: `2px solid ${C[tok.color].light}` }}
                />
              )}
            </motion.div>
          );
        });
      })}
    </div>
  );
};

export default GameBoard;
