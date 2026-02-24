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

/* Ludo Club vivid colors */
const C: Record<PlayerColor, { main: string; light: string; dark: string; track: string }> = {
  red:    { main: '#E53935', light: '#EF5350', dark: '#B71C1C', track: '#FFCDD2' },
  green:  { main: '#43A047', light: '#66BB6A', dark: '#1B5E20', track: '#C8E6C9' },
  blue:   { main: '#1E88E5', light: '#42A5F5', dark: '#0D47A1', track: '#BBDEFB' },
  yellow: { main: '#FDD835', light: '#FFEE58', dark: '#F57F17', track: '#FFF9C4' },
};

const BOARD_FRAME = '#1A237E'; // deep blue frame like reference
const BOARD_BG = '#E8E0CC';   // warm board background
const CELL_BORDER = '#C5B99A';

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
    for (const color of ['red', 'green', 'blue', 'yellow'] as PlayerColor[]) {
      HOME_STRETCH[color].forEach(([r, c]) => m.set(`${r},${c}`, color));
    }
    return m;
  }, []);

  /* Highlight destination cells */
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
      return C[quad].main; // full vivid color like reference
    }
    // Center area
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return 'transparent';
    // Home stretch - full color
    const sc = stretchMap.get(`${r},${c}`);
    if (sc) return C[sc].main;
    // Track cells at start positions - colored
    const tp = trackMap.get(`${r},${c}`);
    if (tp !== undefined && startColors[tp]) return C[startColors[tp]].track;
    // Safe positions with star - slightly tinted
    if (tp !== undefined && STAR_POSITIONS.includes(tp)) return '#F5ECD7';
    return BOARD_BG;
  };

  const pct = (v: number) => `${(v / 15) * 100}%`;

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
                  <span className="text-[0.55rem] sm:text-sm text-white drop-shadow-md" style={{
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  }}>★</span>
                )}
                {isSafe && !isStart && (
                  <span className="text-[0.4rem] sm:text-xs opacity-40">★</span>
                )}
                {isStart && !isStar && (
                  <span className="text-[0.4rem] sm:text-xs opacity-50" style={{ color: C[startColors[tp!]].dark }}>
                    ▶
                  </span>
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

      {/* Center triangles SVG overlay */}
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
              left: pct(c), top: pct(r),
              width: '4.8%', height: '4.8%',
              marginLeft: '-2.4%', marginTop: '-2.4%',
              border: `2px dashed ${C[p.color].main}55`,
              backgroundColor: `${C[p.color].main}10`,
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
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              onClick={() => valid && onTokenClick(token.id)}
              className={`absolute flex items-center justify-center rounded-full z-[10]
                ${valid ? 'cursor-pointer z-[20]' : ''}`}
              style={{
                width: '5%', height: '5%',
                marginLeft: '-2.5%', marginTop: '-2.5%',
                background: `radial-gradient(ellipse at 35% 30%, ${C[p.color].light} 0%, ${C[p.color].main} 50%, ${C[p.color].dark} 100%)`,
                border: `2px solid ${C[p.color].dark}`,
                boxShadow: valid
                  ? `0 0 0 3px ${C[p.color].light}AA, 0 0 14px ${C[p.color].main}88`
                  : `0 3px 8px rgba(0,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.35)`,
              }}
            >
              <span className="text-white text-[0.35rem] sm:text-[0.55rem] font-bold drop-shadow-md select-none">
                {token.id + 1}
              </span>
              {valid && (
                <motion.div
                  className="absolute inset-[-4px] rounded-full"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.9, 0, 0.9] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
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
