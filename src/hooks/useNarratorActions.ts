import { useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import { Round } from '@/types/trivia';
import {
  CORRECT_ANSWER_POINTS,
  WRONG_ANSWER_POINTS,
  MIN_SCORE_LIMIT
} from '@/utils/triviaConstants';
import {
  broadcastNextQuestion,
  broadcastRoundEnd,
  broadcastScoreUpdate
} from '@/utils/triviaBroadcast';

/* …props unchanged… */

export const useNarratorActions = (/* same params */) => {
  const { state, dispatch } = useGame();

  /* helper to update score & return fresh players array */
  const updateScore = (playerId: string, delta: number) => {
    const updated = state.players.map(p =>
      p.id === playerId
        ? { ...p, score: Math.max(MIN_SCORE_LIMIT, (p.score || 0) + delta) }
        : { ...p }
    );
    /* commit to context */
    const pl = updated.find(p => p.id === playerId)!;
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: pl.score } });
    return updated;
  };

  /* ───────── correct ───────── */
  const handleCorrectAnswer = useCallback(
    (playerId: string) => {
      playAudio('success');
      const playersFresh = updateScore(playerId, CORRECT_ANSWER_POINTS);

      /* keep everyone in sync immediately */
      broadcastScoreUpdate(playersFresh);

      /* if not last question just advance */
      const total = 7;
      if (currentQuestionIndex < total - 1) {
        const nextIdx = currentQuestionIndex + 1;
        advanceQuestionLocally(nextIdx);
        broadcastNextQuestion(nextIdx, playersFresh);
        return;
      }

      /* end-of-round logic */
      const { nextNarratorId, isGameOver } = getNextNarrator();
      setNextNarrator(nextNarratorId);
      broadcastRoundEnd(roundNumber, nextNarratorId, playersFresh, isGameOver);
      setShowRoundBridge(true);
      if (isGameOver && setGameOver) setTimeout(() => setGameOver(true), 6500);
    },
    [
      currentQuestionIndex,
      roundNumber,
      getNextNarrator,
      advanceQuestionLocally,
      setNextNarrator,
      setShowRoundBridge,
      setGameOver,
      state.players
    ]
  );

  /* ───────── wrong ───────── */
  const handleWrongAnswer = useCallback(
    (playerId: string) => {
      playAudio('error');
      const playersFresh = updateScore(playerId, WRONG_ANSWER_POINTS);
      broadcastScoreUpdate(playersFresh);
    },
    [state.players]
  );

  /* next question / time-up untouched except they now call broadcastScoreUpdate */

  return { handleCorrectAnswer, handleWrongAnswer, handleNextQuestion, handleTimeUp };
};
