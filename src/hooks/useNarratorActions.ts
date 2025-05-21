// src/hooks/useNarratorActions.ts

import { useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { broadcastScoreUpdate } from '@/utils/triviaBroadcast';
import { CORRECT_ANSWER_POINTS, WRONG_ANSWER_POINTS, MIN_SCORE_LIMIT } from '@/utils/triviaConstants';

export const useNarratorActions = () => {
  const { state, dispatch } = useGame();

  // Helper to update one player's score
  const updateScore = (playerId: string, delta: number) => {
    const current = state.players.find(p => p.id === playerId)?.score || 0;
    const newScore = Math.max(MIN_SCORE_LIMIT, current + delta);
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });
    const updatedPlayers = state.players.map(p =>
      p.id === playerId ? { ...p, score: newScore } : p
    );
    broadcastScoreUpdate(updatedPlayers);
  };

  const handleCorrectAnswer = useCallback((playerId: string) => {
    updateScore(playerId, CORRECT_ANSWER_POINTS);
  }, [state.players]);

  const handleWrongAnswer = useCallback((playerId: string) => {
    updateScore(playerId, WRONG_ANSWER_POINTS);
  }, [state.players]);

  return { handleCorrectAnswer, handleWrongAnswer };
};
