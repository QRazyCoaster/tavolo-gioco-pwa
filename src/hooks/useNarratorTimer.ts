
import { useEffect } from 'react';
import { Round } from '@/types/trivia';

export const useNarratorTimer = (
  isNarrator: boolean,
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  handleNextQuestion: () => void
) => {
  useEffect(() => {
    // Only run timer for narrator and when we have a valid timeLeft
    if (!isNarrator) return;
    
    const timer = setInterval(() => {
      setCurrentRound(prev => {
        if (prev.timeLeft <= 0) {
          clearInterval(timer);
          handleNextQuestion();
          return prev;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isNarrator, setCurrentRound, handleNextQuestion]);

  return {
    timeLeft: currentRound?.timeLeft || 0
  };
};
