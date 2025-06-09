// src/utils/scoreUtils.ts
import { Player } from '@/context/GameContext';
import { MIN_SCORE_LIMIT } from '@/utils/triviaConstants';

/**
 * Updates a player's score and returns the updated players array
 */
export const updatePlayerScore = (
  players: Player[],
  playerId: string,
  delta: number
): Player[] => {
  const current = players.find(p => p.id === playerId)?.score || 0;
  const newScore = Math.max(MIN_SCORE_LIMIT, current + delta);
  
  return players.map(p =>
    p.id === playerId ? { ...p, score: newScore } : p
  );
};