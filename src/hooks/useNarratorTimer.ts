import { useEffect } from 'react';
import { Round } from '@/types/trivia';
import { QUESTION_TIMER } from '@/utils/triviaConstants';

export const useNarratorTimer = (
  isNarrator: boolean,
  showRoundBridge: boolean,
  gameOver: boolean,
  currentQuestionIndex: number,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  handleNextQuestion: () => void
) => {
  useEffect(() => {
    if (!isNarrator || showRoundBridge || gameOver) return;

    // Reset timeLeft at the start of each question
    setCurrentRound(prev => ({
      ...prev,
      timeLeft: QUESTION_TIMER
    }));

    const timerId = setInterval(() => {
      setCurrentRound(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(timerId);
          handleNextQuestion();
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [
    isNarrator,
    showRoundBridge,
    gameOver,
    currentQuestionIndex,
    setCurrentRound,
    handleNextQuestion
  ]);
};
