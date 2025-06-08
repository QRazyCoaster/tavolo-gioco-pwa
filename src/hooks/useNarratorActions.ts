
// src/hooks/useNarratorActions.ts
import { useCallback } from 'react';
import { useGame, Player } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import {
  broadcastScoreUpdate,
  broadcastNextQuestion,
  broadcastRoundEnd
} from '@/utils/triviaBroadcast';
import {
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND,
  CORRECT_ANSWER_POINTS,
  WRONG_ANSWER_POINTS,
  MIN_SCORE_LIMIT
} from '@/utils/triviaConstants';

export const useNarratorActions = (
  currentRoundNumber: number,
  currentQuestionIndex: number,
  advanceQuestionLocally: (nextIndex: number) => void,
  setCurrentRound: React.Dispatch<React.SetStateAction<any>>,
  players: Player[]
) => {
  const { state, dispatch } = useGame();

  /* ───────── helpers ───────── */
  const withUpdatedScores = (playerId: string, delta: number) => {
    const current = state.players.find(p => p.id === playerId)?.score || 0;
    const newScore = Math.max(MIN_SCORE_LIMIT, current + delta);
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });
    return state.players.map(p =>
      p.id === playerId ? { ...p, score: newScore } : p
    );
  };

  /* ───────── correct answer ───────── */
  const handleCorrectAnswer = useCallback(
    (playerId: string) => {
      console.log('[useNarratorActions] round=', currentRoundNumber, 'players=', players.length);

      const updatedPlayers = withUpdatedScores(playerId, CORRECT_ANSWER_POINTS);
      const isLast = currentQuestionIndex >= QUESTIONS_PER_ROUND - 1;

      // Clear player answers immediately after correct answer
      setCurrentRound(prev => ({
        ...prev,
        playerAnswers: []
      }));

      if (isLast) {
        // Let useRoundProgress handle round transitions
        playAudio('success');
      } else {
        const nextIdx = currentQuestionIndex + 1;
        advanceQuestionLocally(nextIdx);
        broadcastNextQuestion(nextIdx, updatedPlayers);
        playAudio('success');
      }

      broadcastScoreUpdate(updatedPlayers);
    },
    [
      currentQuestionIndex,
      currentRoundNumber,
      players,
      advanceQuestionLocally,
      setCurrentRound,
      state.players
    ]
  );

  /* ───────── wrong answer ───────── */
  const handleWrongAnswer = useCallback(
    (playerId: string) => {
      console.log('[useNarratorActions] round=', currentRoundNumber, 'players=', players.length);

      const updatedPlayers = withUpdatedScores(playerId, WRONG_ANSWER_POINTS);

      setCurrentRound(prev => {
        const remaining = prev.playerAnswers.filter(a => a.playerId !== playerId);
        if (remaining.length === 0) {
          const isLast = prev.currentQuestionIndex >= QUESTIONS_PER_ROUND - 1;

          if (isLast) {
            // Let useRoundProgress handle round transitions
            playAudio('notification');
          } else {
            const nextIdx = prev.currentQuestionIndex + 1;
            advanceQuestionLocally(nextIdx);
            broadcastNextQuestion(nextIdx, updatedPlayers);
            playAudio('notification');
            return {
              ...prev,
              currentQuestionIndex: nextIdx,
              playerAnswers: [],
              timeLeft: QUESTION_TIMER
            };
          }
        }
        return { ...prev, playerAnswers: remaining };
      });

      broadcastScoreUpdate(updatedPlayers);
      playAudio('error');
    },
    [
      currentRoundNumber,
      players,
      advanceQuestionLocally,
      setCurrentRound,
      state.players
    ]
  );

  /* ───────── manual next question ───────── */
  const handleNextQuestion = useCallback(() => {
    console.log('[useNarratorActions] manual next question - letting useRoundProgress handle progression');
    // Let useRoundProgress handle all round progression logic
    playAudio('notification');
  }, []);

  /* ───────── time-up ───────── */
  const handleTimeUp = () => {
    // Let useRoundProgress handle all round progression logic
  };

  return { handleCorrectAnswer, handleWrongAnswer, handleNextQuestion, handleTimeUp };
};
