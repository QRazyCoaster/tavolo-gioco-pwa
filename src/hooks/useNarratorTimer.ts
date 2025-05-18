import { useEffect } from 'react';
import { Round } from '@/types/trivia';

/**
 * Runs only on the active narrator while a round is live.
 * When the clock hits 0 it calls handleTimeUp (usually → next question).
 */
export const useNarratorTimer = (
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
