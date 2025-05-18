
import { useState } from 'react';
import { Round, TriviaQuestion } from '@/types/trivia';
import { mockQuestions, QUESTIONS_PER_ROUND, QUESTION_TIMER, MAX_ROUNDS } from '@/utils/triviaConstants';

export const useRoundTransition = (
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setShowRoundBridge: React.Dispatch<React.SetStateAction<boolean>>,
  mockQuestionsData: any[], 
  questionsPerRound: number
) => {
  const [nextNarrator, setNextNarrator] = useState<string>('');
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Get new questions for the next round
  const getNewRoundQuestions = (nextRound: number): TriviaQuestion[] => {
    // Make sure we're using the proper count of questions (QUESTIONS_PER_ROUND)
    return mockQuestionsData
      .slice(0, QUESTIONS_PER_ROUND)
      .map(q => ({ 
        ...q, 
        id: `r${nextRound}-${q.id}` 
      }));
  };

  // Start the next round with new questions and reset state
  const startNextRound = () => {
    console.log('[useRoundTransition] Starting round', nextRoundNumber, 'with narrator', nextNarrator);
    
    setCurrentRound({
      roundNumber: nextRoundNumber,
      narratorId: nextNarrator,
      questions: getNewRoundQuestions(nextRoundNumber),
      currentQuestionIndex: 0,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    });
    
    setShowRoundBridge(false);
  };

  return {
    showRoundBridge: false, // Default value
    setShowRoundBridge,
    nextNarrator,
    setNextNarrator,
    nextRoundNumber,
    setNextRoundNumber,
    gameOver,
    setGameOver,
    getNewRoundQuestions,
    startNextRound
  };
};
