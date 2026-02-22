export type PlayerColor = 'red' | 'green' | 'blue' | 'yellow';

export interface TokenState {
  id: number;
  color: PlayerColor;
  position: number; // -1=home, 0-50=track(relative), 51-56=homeStretch, 57=finished
}

export interface Player {
  color: PlayerColor;
  name: string;
  isAI: boolean;
  tokensFinished: number;
}

export interface GameState {
  players: Player[];
  tokens: Record<PlayerColor, TokenState[]>;
  currentPlayerIndex: number;
  diceValue: number | null;
  hasRolled: boolean;
  canRollAgain: boolean;
  consecutiveSixes: number;
  gameStatus: 'playing' | 'finished';
  winner: PlayerColor | null;
  message: string;
}

export type GameMode = 'ai' | 'local';
export type AILevel = 'easy' | 'medium' | 'hard';
