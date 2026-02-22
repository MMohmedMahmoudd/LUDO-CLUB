import { PlayerColor } from './types';

// 52 main track cells [row, col] on 15×15 grid, clockwise from Red start
export const MAIN_TRACK: [number, number][] = [
  [6,1],[6,2],[6,3],[6,4],[6,5],             // 0-4
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],       // 5-10
  [0,7],[0,8],                                // 11-12
  [1,8],[2,8],[3,8],[4,8],[5,8],             // 13-17
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],  // 18-23
  [7,14],[8,14],                              // 24-25
  [8,13],[8,12],[8,11],[8,10],[8,9],         // 26-30
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],  // 31-36
  [14,7],[14,6],                              // 37-38
  [13,6],[12,6],[11,6],[10,6],[9,6],         // 39-43
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],       // 44-49
  [7,0],[6,0],                                // 50-51
];

export const PLAYER_START: Record<PlayerColor, number> = {
  red: 0, green: 13, blue: 26, yellow: 39,
};

export const HOME_ENTRY_ABSOLUTE: Record<PlayerColor, number> = {
  red: 50, green: 11, blue: 24, yellow: 37,
};

export const HOME_STRETCH: Record<PlayerColor, [number, number][]> = {
  red:    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],
  green:  [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],
  blue:   [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]],
  yellow: [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]],
};

export const HOME_POSITIONS: Record<PlayerColor, [number, number][]> = {
  red:    [[1.5,1.5],[1.5,3.5],[3.5,1.5],[3.5,3.5]],
  green:  [[1.5,10.5],[1.5,12.5],[3.5,10.5],[3.5,12.5]],
  blue:   [[10.5,10.5],[10.5,12.5],[12.5,10.5],[12.5,12.5]],
  yellow: [[10.5,1.5],[10.5,3.5],[12.5,1.5],[12.5,3.5]],
};

export const SAFE_POSITIONS: number[] = [0, 8, 13, 21, 26, 34, 39, 47];
export const STAR_POSITIONS: number[] = [8, 21, 34, 47];
