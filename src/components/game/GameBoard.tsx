import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GameState, PlayerColor } from '@/lib/types';
import {
  MAIN_TRACK, HOME_STRETCH, STAR_POSITIONS, PLAYER_START, HOME_POSITIONS, SAFE_POSITIONS,
} from '@/lib/board-data';
import { getTokenCoordinates, getAbsolutePosition } from '@/lib/game-engine';
import { renderTokenShape } from '@/components/game/TokenShape';

interface Props {
  state: GameState;
  validMoves: number[];
  onTokenClick: (id: number) => void;
  diceValue: number | null;
  canRoll: boolean;
  onRoll: () => void;
  currentPlayerColor: PlayerColor;
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

const DICE_DOTS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[30, 30], [70, 70]],
  3: [[30, 30], [50, 50], [70, 70]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]],
  5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 22], [70, 22], [30, 50], [70, 50], [30, 78], [70, 78]],
};

const DICE_QUADRANT_POS: Record<PlayerColor, { left: string; top: string }> = {
  red:    { left: '20%', top: '20%' },
  green:  { left: '80%', top: '20%' },
  blue:   { left: '80%', top: '80%' },
  yellow: { left: '20%', top: '80%' },
};

const GameBoard = ({ state, validMoves, onTokenClick, diceValue, canRoll, onRoll, currentPlayerColor }: Props) => {
  const cur = state.players[state.currentPlayerIndex];
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = () => {
    if (!canRoll) return;
    setIsRolling(true);
    setTimeout(() => {
      setIsRolling(false);
      onRoll();
    }, 450);
  };

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
    <div className="relative aspect-square w-full max-w-3xl mx-auto select-none h-full">
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

      {/* Dice in active player's quadrant */}
      {(() => {
        const dPos = DICE_QUADRANT_POS[currentPlayerColor];
        return (
          <div
            className="absolute z-[15] flex flex-col items-center gap-0.5"
            style={{
              left: dPos.left,
              top: dPos.top,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <motion.button
              onClick={handleRoll}
              disabled={!canRoll}
              animate={isRolling ? {
                rotateX: [0, 360, 720],
                rotateZ: [0, 90, 0],
                scale: [1, 0.7, 1.1, 1],
              } : {}}
              transition={isRolling ? { duration: 0.45, ease: 'easeInOut' } : {}}
              whileTap={canRoll ? { scale: 0.85 } : undefined}
              whileHover={canRoll ? { scale: 1.1 } : undefined}
              className="relative select-none"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
                border: `3px solid ${canRoll ? C[currentPlayerColor].main : '#999'}`,
                boxShadow: canRoll
                  ? `0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px ${C[currentPlayerColor].main}33`
                  : '0 4px 12px rgba(0,0,0,0.2)',
                cursor: canRoll ? 'pointer' : 'default',
              }}
            >
              {diceValue && !isRolling ? (
                <motion.div
                  key={diceValue}
                  initial={{ rotateZ: 120, scale: 0.2, opacity: 0 }}
                  animate={{ rotateZ: 0, scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25, type: 'spring', stiffness: 350 }}
                  className="w-full h-full relative"
                >
                  {DICE_DOTS[diceValue].map(([x, y], i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        left: `${x}%`, top: `${y}%`,
                        transform: 'translate(-50%,-50%)',
                        width: 7, height: 7,
                        backgroundColor: '#1a1a2e',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
                      }}
                    />
                  ))}
                </motion.div>
              ) : !isRolling ? (
                <span className="text-xl">🎲</span>
              ) : null}
            </motion.button>
            {canRoll && !isRolling && (
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.3 }}
                className="text-[0.5rem] font-bold tracking-widest uppercase"
                style={{ color: C[currentPlayerColor].main }}
              >
                ROLL
              </motion.span>
            )}
          </div>
        );
      })()}

      {/* Tokens - Custom chess-style shapes with color */}
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

          // Get token shape from player profile or default to circle
          const tokenShape = cur.profile?.tokenShape || 'circle';

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
              className={`absolute z-[10] flex items-center justify-center
                ${valid ? 'cursor-pointer z-[20]' : ''}
                transition-transform hover:scale-110`}
              style={{
                width: size,
                height: size,
                filter: valid ? 'drop-shadow(0 0 12px rgba(255,255,255,0.8))' : 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
              }}
            >
              {/* Custom SVG shape based on player's token shape selection */}
              {renderTokenShape(tokenShape, tok.color, size)}
              
              {/* Pulse ring for valid moves */}
              {valid && (
                <motion.div
                  className="absolute inset-[-12px] rounded-full border-2"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.2, 0.8] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  style={{ borderColor: C[tok.color].light }}
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
