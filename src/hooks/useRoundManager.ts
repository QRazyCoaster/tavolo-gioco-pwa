
import { useState } from 'react';
import { Round, TriviaQuestion } from '@/types/trivia';
import { mockQuestions, QUESTION_TIMER, QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';

/**
 * Hook to manage the current round state and transitions between questions
 */
export const useRoundManager = (initialNarratorId: string) => {
  const [currentRound, setCurrentRound] = useState<Round>({
    roundNumber: 1,
    narratorId: initialNarratorId,
    questions: mockQuestions.slice(0, QUESTIONS_PER_ROUND)
      .map(q => ({ ...q, id: `r1-${q.id}` })),
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER
  });

  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set());
  const [showPendingAnswers, setShowPendingAnswers] = useState(false);

  /** Generate question array for a given round */
  const getNewRoundQuestions = (round: number): TriviaQuestion[] =>
    mockQuestions
      .slice(0, QUESTIONS_PER_ROUND)
      .map(q => ({ ...q, id: `r${round}-${q.id}` }));

  /** Reset just for the next question (same round) */
  const resetForNextQuestion = () => {
    setCurrentRound(prev => ({
      ...prev,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    }));
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
  };

  /**
   * Build a fresh Round object for the provided narrator & roundNumber
   */
  const setupNewRound = (narratorId: string, roundNumber: number): Round => {
    console.log('[useRoundManager] Starting round', roundNumber, 'with narrator', narratorId);
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
    showPendingAnswers,
    setShowPendingAnswers,
    resetForNextQuestion,
    setupNewRound
  };
};
