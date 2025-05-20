import { useEffect } from 'react';
import { Round } from '@/types/trivia';

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

    const timer = setInterval(() => {
      setCurrentRound(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          handleNextQuestion();
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isNarrator,
    showRoundBridge,
    gameOver,
    currentQuestionIndex,
    setCurrentRound,
    handleNextQuestion
  ]);
};
