
import { useEffect } from 'react';

export const useNarratorTimer = (
  isNarrator: boolean,
  showRoundBridge: boolean,
  gameOver: boolean,
  setCurrentRound: React.Dispatch<React.SetStateAction<any>>,
  handleTimeUp: () => void
) => {
  useEffect(() => {
    if (!isNarrator || showRoundBridge || gameOver) return;
    const t = setInterval(() => {
      setCurrentRound(prev => {
        const tl = Math.max(0, prev.timeLeft - 1);
        if (tl === 0) handleTimeUp();
        return { ...prev, timeLeft: tl };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isNarrator, showRoundBridge, gameOver, setCurrentRound, handleTimeUp]);
};
