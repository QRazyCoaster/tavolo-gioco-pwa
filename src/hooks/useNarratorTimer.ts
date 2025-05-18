
import { useEffect, useRef } from 'react';
import { Round } from '@/types/trivia';
import { QUESTION_TIMER } from '@/utils/triviaConstants';

export const useNarratorTimer = (
  isNarrator: boolean,
  showRoundBridge: boolean,
  gameOver: boolean,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  onNextQuestion: () => void
) => {
  // Use ref to avoid stale closure issues with the timer
  const onNextQuestionRef = useRef(onNextQuestion);
  
  // Update ref when the function changes
  useEffect(() => {
    onNextQuestionRef.current = onNextQuestion;
  }, [onNextQuestion]);

  useEffect(() => {
    // Only the narrator should run this timer
    if (!isNarrator || showRoundBridge || gameOver) return;

    console.log('[useNarratorTimer] Starting timer for narrator');
    
    const timer = setInterval(() => {
      setCurrentRound((prev) => {
        // If we've hit zero, handle question end
        if (prev.timeLeft <= 1) {
          clearInterval(timer);
          
          // Use the ref to ensure we have the latest function
          setTimeout(() => {
            console.log('[useNarratorTimer] Time up, calling onNextQuestion');
            onNextQuestionRef.current();
          }, 500);
          
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isNarrator, showRoundBridge, gameOver, setCurrentRound]);
};
