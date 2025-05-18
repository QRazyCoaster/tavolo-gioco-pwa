import { useState } from 'react';
import { Round, TriviaQuestion } from '@/types/trivia';
import {
  mockQuestions,
  QUESTIONS_PER_ROUND,
  QUESTION_TIMER
} from '@/utils/triviaConstants';

/** Round-to-round hand-off (local-only; broadcasting happens elsewhere) */
export const useRoundTransition = (mockQuestionsData = mockQuestions) => {
  const [nextNarrator,      setNextNarrator]      = useState<string>('');
  const [nextRoundNumber,   setNextRoundNumber]   = useState<number>(1);
  const [showRoundBridge,   setShowRoundBridge]   = useState<boolean>(false);
  const [gameOver,          setGameOver]          = useState<boolean>(false);

  /* slice a fresh batch of questions */
  const getNewRoundQuestions = (round: number): TriviaQuestion[] =>
    mockQuestionsData
      .slice(0, QUESTIONS_PER_ROUND)
      .map(q => ({ ...q, id: `r${round}-${q.id}` }));

  /** spawn the next Round object and hide the bridge */
  const startNextRound = (narratorId: string, round: number): Round => {
    setShowRoundBridge(false);
    /*  ── keep `nextNarrator` untouched here ──
        we clear it AFTER the caller installs the new round */
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
    /* externally consumed props */
    showRoundBridge,   setShowRoundBridge,
    nextNarrator,      setNextNarrator,
    nextRoundNumber,   setNextRoundNumber,
    gameOver,          setGameOver,
    startNextRound
  };
};
