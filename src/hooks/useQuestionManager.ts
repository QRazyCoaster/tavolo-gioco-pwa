
import { useMemo } from 'react';
import { Round, TriviaQuestion } from '@/types/trivia';

export const useQuestionManager = (currentRound: Round) => {
  // Safely get the current question
  const currentQuestion = useMemo((): TriviaQuestion => {
    const questions = currentRound?.questions || [];
    const index = currentRound?.currentQuestionIndex || 0;
    
    if (!questions.length) {
      // Return a fallback question if the array is empty
      return {
        id: 'fallback',
        textEn: 'No questions available',
        textIt: 'Nessuna domanda disponibile',
        answerEn: '',
        answerIt: ''
      };
    }
    
    // Ensure we don't go out of bounds
    const safeIndex = Math.min(index, questions.length - 1);
    return questions[safeIndex];
  }, [currentRound]);

  // Calculate the 1-based question number (for display)
  const questionNumber = useMemo(() => {
    return (currentRound?.currentQuestionIndex || 0) + 1;
  }, [currentRound]);

  // Get total number of questions in this round
  const totalQuestions = useMemo(() => {
    return currentRound?.questions?.length || 0;
  }, [currentRound]);
  
  console.log('[useQuestionManager] Current question number:', questionNumber);
  console.log('[useQuestionManager] Total questions:', totalQuestions);

  return {
    currentQuestion,
    questionNumber,
    totalQuestions
  };
};
