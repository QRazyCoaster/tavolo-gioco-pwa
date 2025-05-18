
import { useEffect, useRef } from 'react';
import { Round } from '@/types/trivia';

/**
 * Narrator-only countdown timer hook.
 * Triggers handleNextQuestion() when timeLeft hits 0.
 */
export const useNarratorTimer = (
  isNarrator: boolean,
  showRoundBridge: boolean,
  gameOver: boolean,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  handleNextQuestion: () => void
) => {
  const handleNextQuestionRef = useRef(handleNextQuestion);

  // Update the ref whenever the callback changes
  useEffect(() => {
    handleNextQuestionRef.current = handleNextQuestion;
  }, [handleNextQuestion]);

  useEffect(() => {
    // Run ONLY for narrator, during active round
    if (!isNarrator || showRoundBridge || gameOver) return;

    const timer = setInterval(() => {
      setCurrentRound(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          // Use the ref to ensure we always have the latest function
          handleNextQuestionRef.current();
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isNarrator, showRoundBridge, gameOver, setCurrentRound]);

  // NOTE: we no longer return { timeLeft } here — currentRound handles it
};
