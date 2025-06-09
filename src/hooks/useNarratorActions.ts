
// src/hooks/useNarratorActions.ts
import { useCallback } from 'react';
import { Player } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import { useNarratorAnswerHandlers } from './useNarratorAnswerHandlers';

export const useNarratorActions = (
  currentRoundNumber: number,
  currentQuestionIndex: number,
  advanceQuestionLocally: (nextIndex: number) => void,
  setCurrentRound: React.Dispatch<React.SetStateAction<any>>,
  players: Player[]
) => {
  // Delegate answer handling to specialized hook
  const { handleCorrectAnswer, handleWrongAnswer } = useNarratorAnswerHandlers(
    currentRoundNumber,
    currentQuestionIndex,
    advanceQuestionLocally,
    setCurrentRound,
    players
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
