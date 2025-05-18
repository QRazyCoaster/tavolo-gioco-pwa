import { useState } from 'react';
import { Round, TriviaQuestion } from '@/types/trivia';
import {
  mockQuestions,
  QUESTIONS_PER_ROUND,
  QUESTION_TIMER
} from '@/utils/triviaConstants';

/**
 * Handles the hand-off between rounds and decides when the game is over.
 * It is purely local to the current tab – broadcast happens elsewhere.
 */
export const useRoundTransition = (
  mockQuestionsData: typeof mockQuestions
) => {
  const [nextNarrator,      setNextNarrator]      = useState<string>('');
  const [nextRoundNumber,   setNextRoundNumber]   = useState<number>(1);
  const [showRoundBridge,   setShowRoundBridge]   = useState<boolean>(false);
  const [gameOver,          setGameOver]          = useState<boolean>(false);

  /* helper – slice a fresh set of questions every round */
  const getNewRoundQuestions = (round: number): TriviaQuestion[] =>
    mockQuestionsData
      .slice(0, QUESTIONS_PER_ROUND)
      .map(q => ({ ...q, id: `r${round}-${q.id}` }));

  /**
   * Spawns the next Round object and hides the bridge for all tabs.
   * The caller is responsible for `setCurrentRound(newRound)`.
   */
  const startNextRound = (narratorId: string, round: number): Round => {
    setShowRoundBridge(false);
    setNextNarrator('');
    return {
      roundNumber: round,
      narratorId,
      questions: getNewRoundQuestions(round),
      currentQuestionIndex: 0,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    };
  };

  return {
    /* external API */
    showRoundBridge, setShowRoundBridge,
    nextNarrator,    setNextNarrator,
    nextRoundNumber, setNextRoundNumber,
    gameOver,        setGameOver,
    startNextRound
  };
};
