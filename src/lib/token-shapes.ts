import { TokenShape } from './types';

export const TOKEN_SHAPES: Record<TokenShape, string> = {
  circle: '●',
  horse: '🐴',
  lion: '🦁',
  wolf: '🐺',
  bomb: '💣',
  star: '⭐',
  heart: '❤️',
};

export const TOKEN_SHAPE_LABELS: Record<TokenShape, string> = {
  circle: 'Circle',
  horse: 'Horse',
  lion: 'Lion',
  wolf: 'Wolf',
  bomb: 'Bomb',
  star: 'Star',
  heart: 'Heart',
};

export const ALL_TOKEN_SHAPES: TokenShape[] = ['circle', 'horse', 'lion', 'wolf', 'bomb', 'star', 'heart'];
