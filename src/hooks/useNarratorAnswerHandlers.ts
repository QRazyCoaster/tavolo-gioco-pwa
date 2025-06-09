// src/hooks/useNarratorAnswerHandlers.ts
import { useCallback } from 'react';
import { useGame, Player } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import { broadcastScoreUpdate, broadcastNextQuestion } from '@/utils/triviaBroadcast';
import { updatePlayerScore } from '@/utils/scoreUtils';
import {
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND,
  CORRECT_ANSWER_POINTS,
  WRONG_ANSWER_POINTS
} from '@/utils/triviaConstants';

export const useNarratorAnswerHandlers = (
  currentRoundNumber: number,
  currentQuestionIndex: number,
  advanceQuestionLocally: (nextIndex: number) => void,
  setCurrentRound: React.Dispatch<React.SetStateAction<any>>,
  players: Player[],
  onNextQuestion: () => void
) => {
  const { state, dispatch } = useGame();

  /* ───────── correct answer ───────── */
  const handleCorrectAnswer = useCallback(
    (playerId: string) => {
      console.log('[useNarratorAnswerHandlers] round=', currentRoundNumber, 'players=', players.length);

      const updatedPlayers = updatePlayerScore(state.players, playerId, CORRECT_ANSWER_POINTS);
      dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: updatedPlayers.find(p => p.id === playerId)?.score || 0 } });

      const isLast = currentQuestionIndex >= QUESTIONS_PER_ROUND - 1;

      // Clear player answers immediately after correct answer
      setCurrentRound(prev => ({
        ...prev,
        playerAnswers: []
      }));

      if (isLast) {
        // Trigger round progression for last question
        onNextQuestion();
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
      state.players,
      dispatch,
      onNextQuestion
    ]
  );

  /* ───────── wrong answer ───────── */
  const handleWrongAnswer = useCallback(
    (playerId: string) => {
      console.log('[useNarratorAnswerHandlers] round=', currentRoundNumber, 'players=', players.length);

      const updatedPlayers = updatePlayerScore(state.players, playerId, WRONG_ANSWER_POINTS);
      dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: updatedPlayers.find(p => p.id === playerId)?.score || 0 } });

      setCurrentRound(prev => {
        const remaining = prev.playerAnswers.filter(a => a.playerId !== playerId);
        if (remaining.length === 0) {
          const isLast = prev.currentQuestionIndex >= QUESTIONS_PER_ROUND - 1;

          if (isLast) {
            // Trigger round progression for last question
            onNextQuestion();
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
      state.players,
      dispatch,
      onNextQuestion
    ]
  );

  return { handleCorrectAnswer, handleWrongAnswer };
};