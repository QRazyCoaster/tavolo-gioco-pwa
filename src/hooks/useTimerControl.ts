
import { useEffect } from 'react';
import { Round } from '@/types/trivia';

/**
 * Hook to manage the timer for questions when run by the narrator
 */
export const useTimerControl = (
  isNarrator: boolean,
  showRoundBridge: boolean,
  gameOver: boolean,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  handleTimeUp: () => void
) => {
  useEffect(() => {
    if (!isNarrator || showRoundBridge || gameOver) return;

    const id = setInterval(() => {
      setCurrentRound(prev => {
        if (prev.timeLeft <= 0) {
          clearInterval(id);
          handleTimeUp();
          return prev;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1_000);

    return () => clearInterval(id);
  }, [isNarrator, showRoundBridge, gameOver, setCurrentRound, handleTimeUp]);
};
