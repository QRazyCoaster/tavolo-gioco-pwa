
import { useMemo } from 'react';
import { Round, TriviaQuestion } from '@/types/trivia';

/**
 * Hook to manage and extract the current question state
 */
export const useQuestionState = (currentRound: Round) => {
  // Get the current question
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
        answerIt: '',
        categoryId: 'general', 
        difficulty: 'easy'
      };
    }
    
    // Ensure we don't go out of bounds
    const safeIndex = Math.min(index, questions.length - 1);
    return questions[safeIndex];
  }, [currentRound]);

  // Calculate the question number (1-based) for display
  const questionNumber = useMemo(() => {
    return (currentRound?.currentQuestionIndex || 0) + 1;
  }, [currentRound]);

  // Get total number of questions in this round
  const totalQuestions = useMemo(() => {
    return currentRound?.questions?.length || 0;
  }, [currentRound]);

  return {
    currentQuestion,
    questionNumber,
    totalQuestions
  };
};
