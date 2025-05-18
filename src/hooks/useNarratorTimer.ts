import { useEffect } from 'react';
import { Round } from '@/types/trivia';

export const useNarratorTimer = (
  isNarrator: boolean,
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  handleNextQuestion: () => void
) => {
  useEffect(() => {
    if (!isNarrator) return;                     // run ONLY for narrator

    const t = setInterval(() => {
      setCurrentRound(prev => {
        if (prev.timeLeft <= 0) {
          clearInterval(t);
          handleNextQuestion();
          return prev;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(t);
  }, [isNarrator, setCurrentRound, handleNextQuestion]);

  return { timeLeft: currentRound.timeLeft };
};
