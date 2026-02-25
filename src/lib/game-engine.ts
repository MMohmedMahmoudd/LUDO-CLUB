import { GameState, TokenState, Player, PlayerColor, AILevel } from './types';
import {
  MAIN_TRACK, PLAYER_START, HOME_STRETCH, HOME_POSITIONS,
  SAFE_POSITIONS, HOME_ENTRY_ABSOLUTE,
} from './board-data';

export function getAbsolutePosition(color: PlayerColor, relativePos: number): number {
  return (PLAYER_START[color] + relativePos) % 52;
}

export function getTokenCoordinates(
  color: PlayerColor, tokenId: number, position: number,
): [number, number] {
  if (position === -1) return HOME_POSITIONS[color][tokenId];
  if (position >= 0 && position <= 50) {
    return MAIN_TRACK[getAbsolutePosition(color, position)];
  }
  if (position >= 51 && position <= 56) {
    return HOME_STRETCH[color][position - 51];
  }
  const off: [number, number][] = [[-0.3,-0.3],[-0.3,0.3],[0.3,-0.3],[0.3,0.3]];
  return [7 + off[tokenId][0], 7 + off[tokenId][1]];
}

export function createInitialState(
  colors: PlayerColor[], aiPlayers: PlayerColor[],
): GameState {
  const tokens = {} as Record<PlayerColor, TokenState[]>;
  const players: Player[] = [];
  for (const color of colors) {
    tokens[color] = Array.from({ length: 4 }, (_, i) => ({
      id: i, color, position: -1,
    }));
    players.push({
      color,
      name: color.charAt(0).toUpperCase() + color.slice(1),
      isAI: aiPlayers.includes(color),
      tokensFinished: 0,
    });
  }
  return {
    players, tokens,
    currentPlayerIndex: 0,
    diceValue: null,
    hasRolled: false,
    canRollAgain: false,
    consecutiveSixes: 0,
    gameStatus: 'playing',
    winner: null,
    message: `${players[0].name}'s turn — Roll the dice!`,
  };
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function getValidMoves(state: GameState): number[] {
  const player = state.players[state.currentPlayerIndex];
  const tokens = state.tokens[player.color];
  const dice = state.diceValue!;
  return tokens
    .filter(t => {
      if (t.position === 57) return false;
      if (t.position === -1) return dice === 6;
      return t.position + dice <= 57;
    })
    .map(t => t.id);
}

export function executeMove(state: GameState, tokenId: number): GameState {
  const s: GameState = JSON.parse(JSON.stringify(state));
  const player = s.players[s.currentPlayerIndex];
  const token = s.tokens[player.color][tokenId];
  const dice = s.diceValue!;
  let killed = false;

  if (token.position === -1) {
    token.position = 0;
  } else {
    token.position += dice;
  }

  // kill check (main track only)
  if (token.position >= 0 && token.position <= 50) {
    const abs = getAbsolutePosition(player.color, token.position);
    if (!SAFE_POSITIONS.includes(abs)) {
      for (const oc of Object.keys(s.tokens) as PlayerColor[]) {
        if (oc === player.color) continue;
        for (const ot of s.tokens[oc]) {
          if (ot.position >= 0 && ot.position <= 50 &&
              getAbsolutePosition(oc, ot.position) === abs) {
            ot.position = -1;
            killed = true;
          }
        }
      }
    }
  }

  const finished = token.position === 57;
  if (finished) {
    player.tokensFinished++;
    if (player.tokensFinished === 4) {
      s.gameStatus = 'finished';
      s.winner = player.color;
      s.message = `🎉 ${player.name} wins!`;
      return s;
    }
  }

  if (dice === 6 || killed || finished) {
    s.canRollAgain = true;
    s.consecutiveSixes = dice === 6 ? s.consecutiveSixes + 1 : 0;
    if (finished) {
      s.message = `${player.name} reached home! Extra turn!`;
    } else if (killed) {
      s.message = `${player.name} captured! Extra turn!`;
    } else {
      s.message = `${player.name} rolled 6! Extra turn!`;
    }
  } else {
    s.currentPlayerIndex = (s.currentPlayerIndex + 1) % s.players.length;
    s.consecutiveSixes = 0;
    s.canRollAgain = false;
    s.message = `${s.players[s.currentPlayerIndex].name}'s turn — Roll the dice!`;
  }

  s.diceValue = null;
  s.hasRolled = false;
  return s;
}

export function getAIMove(state: GameState, difficulty: AILevel): number {
  const valid = getValidMoves(state);
  if (valid.length <= 1) return valid[0] ?? -1;
  if (difficulty === 'easy') return valid[Math.floor(Math.random() * valid.length)];

  const player = state.players[state.currentPlayerIndex];
  const tokens = state.tokens[player.color];
  const dice = state.diceValue!;
  let best = -Infinity, bestId = valid[0];

  for (const id of valid) {
    let score = 0;
    const t = tokens[id];
    const np = t.position === -1 ? 0 : t.position + dice;

    if (t.position === -1) score += 10;
    if (np === 57) score += 100;
    if (np >= 51 && np < 57) score += 30;

    if (np >= 0 && np <= 50) {
      const abs = getAbsolutePosition(player.color, np);
      for (const oc of Object.keys(state.tokens) as PlayerColor[]) {
        if (oc === player.color) continue;
        for (const ot of state.tokens[oc]) {
          if (ot.position >= 0 && ot.position <= 50 &&
              getAbsolutePosition(oc, ot.position) === abs) {
            score += difficulty === 'hard' ? 80 : 50;
          }
        }
      }
      if (SAFE_POSITIONS.includes(abs)) score += 15;
      if (difficulty === 'hard') {
        for (const oc of Object.keys(state.tokens) as PlayerColor[]) {
          if (oc === player.color) continue;
          for (const ot of state.tokens[oc]) {
            if (ot.position >= 0 && ot.position <= 50) {
              const d = (abs - getAbsolutePosition(oc, ot.position) + 52) % 52;
              if (d <= 6) score -= 20;
            }
          }
        }
      }
    }
    score += np * (difficulty === 'hard' ? 1.5 : 1);
    if (score > best) { best = score; bestId = id; }
  }
  return bestId;
}
