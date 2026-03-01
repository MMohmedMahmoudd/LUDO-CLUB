export type PlayerColor = 'red' | 'green' | 'blue' | 'yellow';
export type TokenShape = 'circle' | 'horse' | 'lion' | 'wolf' | 'bomb' | 'star' | 'heart';

export interface TokenState {
  id: number;
  color: PlayerColor;
  position: number; // -1=home, 0-50=track(relative), 51-56=homeStretch, 57=finished
}

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
  profile?: PlayerProfile;
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
 // (unchanged)
export type GameMode = 'ai' | 'local' | 'online';
export type AILevel = 'easy' | 'medium' | 'hard';
