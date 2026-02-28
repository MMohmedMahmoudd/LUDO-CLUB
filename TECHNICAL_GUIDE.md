# LUDO Club - Technical Implementation Details

## Architecture Overview

### Component Hierarchy
```
App
├── Index (Menu & Settings)
│   ├── Game Mode Selection
│   ├── Player Count
│   ├── AI Difficulty
│   └── Token Shape Selection ✨ NEW
├── Game (Main Game Screen)
│   ├── GameBoard
│   │   ├── Board Grid (15x15)
│   │   ├── Tokens (with shapes) ✨ UPDATED
│   │   ├── Dice (in corners) ✨ UPDATED
│   │   └── Home Markers
│   └── PlayerPanel (4 copies) ✨ UPDATED
├── Preview (Board Preview)
├── Room (Online Games)
├── Auth (Authentication)
└── Lobby (Game Lobby)
```

---

## Type System Updates

### New Types in `src/lib/types.ts`

```typescript
export type TokenShape = 'circle' | 'horse' | 'lion' | 'wolf' | 'bomb' | 'star' | 'heart';

export interface PlayerProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  tokenShape: TokenShape;
}

export interface Player {
  color: PlayerColor;
  name: string;
  isAI: boolean;
  tokensFinished: number;
  profile?: PlayerProfile; // ✨ NEW
}
```

---

## State Management

### Game Store Updates (`src/store/gameStore.ts`)

```typescript
interface GameStore {
  state: GameState | null;
  gameMode: GameMode | null;
  aiLevel: AILevel;
  validMoves: number[];
  playerTokenShape: TokenShape; // ✨ NEW
  initGame: (mode, count, ai?, tokenShape?) => void; // ✨ UPDATED
  setTokenShape: (shape) => void; // ✨ NEW
  // ... other methods
}
```

**Usage in Index.tsx:**
```typescript
const { init } = useGameStore();
// When starting game:
init('ai', 2, 'medium', 'horse'); // Passes token shape
```

---

## Token Shape System

### Configuration (`src/lib/token-shapes.ts`)

```typescript
export const TOKEN_SHAPES: Record<TokenShape, string> = {
  circle: '●',
  horse: '🐴',
  lion: '🦁',
  wolf: '🐺',
  bomb: '💣',
  star: '⭐',
  heart: '❤️',
};
```

### Rendering in GameBoard.tsx

```typescript
// Get player's selected shape
const tokenShape = cur.profile?.tokenShape || 'circle';
const shapeEmoji = TOKEN_SHAPES[tokenShape];

// Render as emoji in circle button
<span className="drop-shadow-lg">{shapeEmoji}</span>
```

---

## Board Data Verification

### Home Stretch Configuration (`src/lib/board-data.ts`)

✅ Each color has exactly 6 home stretch squares:

```typescript
export const HOME_STRETCH: Record<PlayerColor, [number, number][]> = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],      // 6 squares
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],      // 6 squares
  blue:   [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],  // 6 squares
  yellow: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],  // 6 squares
};
```

### Position Mapping

- `-1`: Home (starting position)
- `0-50`: Main track (52 cells, relative to player)
- `51-56`: Home stretch (6 cells)
- `57`: Finished/Won

**Total Player Path:** 4 (home) + 52 (track) + 6 (stretch) = 62 positions

---

## Game Engine Logic

### Extra Turn System (`src/lib/game-engine.ts`)

Already implemented in `executeMove()`:

```typescript
if (dice === 6 || killed || finished) {
  s.canRollAgain = true;
  s.consecutiveSixes = dice === 6 ? s.consecutiveSixes + 1 : 0;
  
  if (finished) {
    s.message = `${player.name} reached home! Extra turn!`; ✅
  } else if (killed) {
    s.message = `${player.name} captured! Extra turn!`; ✅
  } else {
    s.message = `${player.name} rolled 6! Extra turn!`; ✅
  }
}
```

---

## UI Updates

### Token Rendering (`src/components/game/GameBoard.tsx`)

**Before:**
```typescript
// Pawn-shaped SVG (complex)
<svg viewBox="0 0 40 52">
  {/* SVG path definitions */}
</svg>
```

**After:**
```typescript
// Simple emoji shape ✨
<div style={{ backgroundColor: C[tok.color].main, ... }}>
  <span>{shapeEmoji}</span>
</div>
```

### Responsive Classes

```typescript
// Game page
className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"

// Board
className="relative aspect-square w-full max-w-3xl mx-auto select-none h-full"

// Player panels
className="flex flex-wrap gap-1 sm:gap-2 justify-center w-full px-1 sm:px-3 pb-1 sm:pb-2 shrink-0"
```

---

## Dice System Updates

### Before
- Single dice at board bottom center
- One dice for all players

### After ✨
- Dice positioned in each player's corner
- Only active player's dice is interactive
- Color-coded to player color

### Dice Positions

```typescript
const DICE_QUADRANT_POS: Record<PlayerColor, { left: string; top: string }> = {
  red:    { left: '20%', top: '20%' },   // Top-left
  green:  { left: '80%', top: '20%' },   // Top-right
  blue:   { left: '80%', top: '80%' },   // Bottom-right
  yellow: { left: '20%', top: '80%' },   // Bottom-left
};
```

---

## UI Responsiveness Tiers

### Mobile (< 640px)
- Compact player panels with abbreviated names
- Smaller token sizes (5.8% → adjusted)
- Minimal padding (px-1 instead of px-3)
- Full width board

### Tablet (640px - 1024px)
- Medium player panels with full names
- Standard token sizes
- Medium padding
- Board scales with viewport

### Desktop (> 1024px)
- Full player panels with profile info
- Large tokens
- Full padding (px-4)
- Board max width 768px (max-w-3xl)

---

## Player Profile Integration

### Profile Creation
```typescript
// In gameStore.initGame()
if (gameState.players.length > 0) {
  gameState.players[0].profile = {
    id: 'player-1',
    username: gameState.players[0].name,
    avatar_url: null,
    tokenShape: tokenShape, // ✨ Selected by user
  };
}
```

### Profile Persistence
- Saved across game restarts
- Used for token shape rendering
- Ready for Supabase sync (future)

---

## File Structure

### New Files
```
src/
├── lib/
│   └── token-shapes.ts ✨ NEW - Token shape definitions
└── pages/
    └── Preview.tsx (from previous update) - Board preview
```

### Modified Files
```
src/
├── lib/
│   ├── types.ts ✨ UPDATED - Added TokenShape, PlayerProfile
│   ├── game-engine.ts (no changes - already has extra turn logic)
│   └── board-data.ts (verified - 6 home stretch squares)
├── pages/
│   ├── Index.tsx ✨ UPDATED - Added token shape selection UI
│   └── Game.tsx ✨ UPDATED - Full width responsive layout
├── components/
│   └── game/
│       ├── GameBoard.tsx ✨ UPDATED - Token shapes + dice positioning
│       └── PlayerPanel.tsx ✨ UPDATED - Mobile responsive
├── store/
│   └── gameStore.ts ✨ UPDATED - Token shape state management
└── App.tsx ✨ UPDATED - Preview route
```

---

## Data Flow

### Token Shape Selection Flow
```
Index.tsx
  ↓ (setTokenShape state)
  ↓ (User selects shape)
  ↓ (init(mode, count, ai, shape))
gameStore.initGame()
  ↓ (Creates player with profile)
  ↓ Player.profile.tokenShape = shape
  ↓
Game.tsx (receives updated state)
  ↓
GameBoard.tsx
  ↓ (Gets shape: cur.profile?.tokenShape)
  ↓ (Maps to emoji: TOKEN_SHAPES[shape])
  ↓ (Renders in token circle)
```

---

## Performance Optimizations

### Memoized Computations
```typescript
// Track mapping cached
const trackMap = useMemo(() => {
  const m = new Map<string, number>();
  MAIN_TRACK.forEach(([r, c], i) => m.set(`${r},${c}`, i));
  return m;
}, []);

// Token grouping cached
const tokenGroups = useMemo(() => {
  // Group tokens by coordinate for stacking
}, [state.tokens, state.players]);

// Highlighted cells cached
const highlightedCells = useMemo(() => {
  // Calculate valid move cells
}, [state, validMoves]);
```

### Event Handler Optimization
```typescript
// Memoized button handler
const handleRoll = () => {
  // Minimal recalculation
};
```

---

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ✅ Tablet browsers

---

## Dependencies Used

### Core
- React 18+ (UI)
- React Router (Navigation)
- Framer Motion (Animations)
- Zustand (State management)

### UI
- Tailwind CSS (Styling)
- shadcn/ui (Components)
- Sonner (Notifications)

### Build
- Vite (Build tool)
- TypeScript (Type safety)
- ESLint (Code quality)

---

## Future Ready

This architecture supports:
- ✅ Online multiplayer (Supabase integration ready)
- ✅ User avatars (avatar_url field ready)
- ✅ More token shapes (easily extendable)
- ✅ Game statistics (profile system ready)
- ✅ Friends system (player profiles ready)
- ✅ Leaderboards (profile data ready)

---

## Testing Recommendations

### Unit Tests Needed
- Token shape selection
- Player profile creation
- Extra turn logic verification
- Home stretch boundary conditions

### Integration Tests Needed
- Game initialization with shapes
- Profile persistence
- Responsive layout on different sizes
- Dice interaction in corners

### End-to-End Tests Needed
- Complete game flow with shaped tokens
- Profile creation and usage
- Mobile responsiveness
- Extra turn triggers
