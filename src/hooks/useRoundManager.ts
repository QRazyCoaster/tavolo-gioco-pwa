
import { useState } from 'react';
import { Round, TriviaQuestion } from '@/types/trivia';
import { mockQuestions, QUESTION_TIMER, QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';

/**
 * Hook to manage the current round state and transitions between questions
 */
export const useRoundManager = (currentNarratorId: string) => {
  /* ───────── current-round state ───────── */
  const [currentRound, setCurrentRound] = useState<Round>({
    roundNumber: 1,
    narratorId: currentNarratorId,
    questions: mockQuestions.slice(0, QUESTIONS_PER_ROUND)
      .map(q => ({ ...q, id: `r1-${q.id}` })),
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER
  });

  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set());
  const [showPending, setShowPending] = useState(false);

  /**
   * Creates a new set of questions for a round
   */
  const getNewRoundQuestions = (round: number): TriviaQuestion[] =>
    mockQuestions
      .slice(0, QUESTIONS_PER_ROUND)
      .map(q => ({ ...q, id: `r${round}-${q.id}` }));

  /**
   * Resets the current round's state for a new question
   */
  const resetForNextQuestion = () => {
    setCurrentRound(prev => ({
      ...prev,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    }));
    setAnsweredPlayers(new Set());
    setShowPending(false);
  };

  /**
   * Sets up a new round with the given parameters
   */
  const setupNewRound = (narratorId: string, roundNumber: number): Round => {
    console.log('[useRoundManager] Setting up round', roundNumber, 'with narrator', narratorId);
    
    return {
      roundNumber,
      narratorId,
      questions: getNewRoundQuestions(roundNumber),
      currentQuestionIndex: 0,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    };
  };

  return {
    currentRound,
    setCurrentRound,
    answeredPlayers,
    setAnsweredPlayers,
    showPending,
    setShowPending,
    resetForNextQuestion,
    setupNewRound
  };
};
