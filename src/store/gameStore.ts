import { create } from 'zustand';
import { GameState, PlayerColor, GameMode, AILevel } from '@/lib/types';
import {
  createInitialState, rollDice as roll, getValidMoves, executeMove,
} from '@/lib/game-engine';

interface GameStore {
  state: GameState | null;
  gameMode: GameMode | null;
  aiLevel: AILevel;
  validMoves: number[];
  initGame: (mode: GameMode, count: number, ai?: AILevel) => void;
  rollDice: () => void;
  selectToken: (id: number) => void;
  skipTurn: () => void;
  resetGame: () => void;
  restartGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: null,
  gameMode: null,
  aiLevel: 'medium',
  validMoves: [],

  initGame: (mode, count, ai = 'medium') => {
    const all: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
    const colors = all.slice(0, count);
    const aiPlayers = mode === 'ai' ? colors.slice(1) : [];
    set({
      state: createInitialState(colors, aiPlayers),
      gameMode: mode, aiLevel: ai, validMoves: [],
    });
  },

  rollDice: () => {
    const { state } = get();
    if (!state || state.hasRolled || state.gameStatus !== 'playing') return;
    const dice = roll();
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
    const idx = (state.currentPlayerIndex + 1) % state.players.length;
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
    const colors = state.players.map(p => p.color);
    const ais = state.players.filter(p => p.isAI).map(p => p.color);
    set({ state: createInitialState(colors, ais), validMoves: [] });
  },
}));
