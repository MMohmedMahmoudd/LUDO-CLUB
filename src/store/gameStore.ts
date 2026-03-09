import { create } from 'zustand';
import { GameState, PlayerColor, GameMode, AILevel, TokenShape } from '@/lib/types';
import {
  createInitialState, rollDice as roll, getValidMoves, executeMove,
} from '@/lib/game-engine';

interface GameStore {
  state: GameState | null;
  gameMode: GameMode | null;
  aiLevel: AILevel;
  validMoves: number[];
  playerTokenShape: TokenShape;
  myProfileId: string | null;
  initGame: (mode: GameMode, colors: PlayerColor[], ai?: AILevel, tokenShape?: TokenShape, playerShapes?: Record<number, TokenShape>) => void;
  loadState: (state: GameState, mode: GameMode, profileId?: string) => void;
  setGameState: (state: GameState) => void;
  setMyProfileId: (id: string) => void;
  rollDice: () => void;
  selectToken: (id: number) => void;
  skipTurn: () => void;
  resetGame: () => void;
  restartGame: () => void;
  setTokenShape: (shape: TokenShape) => void;
  isMyTurn: () => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  gameMode: null,
  aiLevel: 'medium',
  validMoves: [],
  playerTokenShape: 'circle',
  myProfileId: null,

  initGame: (mode, colors, ai = 'medium', tokenShape = 'circle', playerShapes = {}) => {
    const aiPlayers = mode === 'ai' ? colors.slice(1) : [];
    const gameState = createInitialState(colors, aiPlayers);

    // Add profile to each player with their selected token shape
    gameState.players.forEach((p, i) => {
      p.profile = {
        id: `player-${i + 1}`,
        username: p.name,
        avatar_url: null,
        tokenShape: playerShapes[i] ?? tokenShape,
      };
    });

    set({
      state: gameState,
      gameMode: mode,
      aiLevel: ai,
      validMoves: [],
      playerTokenShape: tokenShape,
    });
  },

  rollDice: () => {
    const { state } = get();
    if (!state || state.hasRolled || state.gameStatus !== 'playing') return;
    const dice = roll();

    // Three consecutive sixes: cancel turn, no movement allowed
    if (dice === 6 && state.consecutiveSixes >= 2) {
      set({
        state: {
          ...state,
          diceValue: dice,
          hasRolled: true,
          consecutiveSixes: 0,
          canRollAgain: false,
          message: `${state.players[state.currentPlayerIndex].name} rolled three 6s! Turn cancelled.`,
        },
        validMoves: [],
      });
      return;
    }

    const ns = { ...state, diceValue: dice, hasRolled: true };
    set({ state: ns, validMoves: getValidMoves(ns) });
  },

  selectToken: (id) => {
    const { state, validMoves } = get();
    if (!state || !validMoves.includes(id)) return;
    set({ state: executeMove(state, id), validMoves: [] });
  },

  skipTurn: () => {
    const { state } = get();
    if (!state) return;
    // Find the next player who hasn't finished all tokens
    const len = state.players.length;
    let idx = (state.currentPlayerIndex + 1) % len;
    for (let i = 0; i < len; i++) {
      if (!state.rankings.includes(state.players[idx].color)) break;
      idx = (idx + 1) % len;
    }
    const next = state.players[idx];
    set({
      state: {
        ...state,
        currentPlayerIndex: idx,
        diceValue: null,
        hasRolled: false,
        consecutiveSixes: 0,
        canRollAgain: false,
        message: `${next.name}'s turn — Roll the dice!`,
      },
      validMoves: [],
    });
  },

  resetGame: () => set({ state: null, gameMode: null, validMoves: [] }),

  restartGame: () => {
    const { state, gameMode, aiLevel } = get();
    if (!state || !gameMode) return;
    const oldProfiles = state.players.map(p => p.profile);
    const colors = state.players.map(p => p.color);
    const ais = state.players.filter(p => p.isAI).map(p => p.color);
    const gameState = createInitialState(colors, ais);

    // Restore all player profiles (colors + shapes)
    gameState.players.forEach((p, i) => {
      if (oldProfiles[i]) p.profile = oldProfiles[i];
    });

    set({ state: gameState, validMoves: [] });
  },

  setTokenShape: (shape) => set({ playerTokenShape: shape }),

  setMyProfileId: (id) => set({ myProfileId: id }),

  isMyTurn: () => {
    const { state, gameMode, myProfileId } = get();
    if (!state || state.gameStatus !== 'playing') return false;
    // In non-online modes, it's always "my turn" (local control)
    if (gameMode !== 'online') return true;
    if (!myProfileId) return false;
    const cur = state.players[state.currentPlayerIndex];
    return cur.profile?.id === myProfileId;
  },

  // helpers used for online games
  loadState: (state, mode, profileId) => {
    set({ state, gameMode: mode, validMoves: getValidMoves(state), ...(profileId ? { myProfileId: profileId } : {}) });
  },
  setGameState: (state) => {
    set({ state, validMoves: getValidMoves(state) });
  },
}))
