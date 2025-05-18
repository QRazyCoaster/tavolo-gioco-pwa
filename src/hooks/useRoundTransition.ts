
import { useState } from 'react';
import { Round, TriviaQuestion } from '@/types/trivia';
import {
  mockQuestions,
  QUESTIONS_PER_ROUND,
  QUESTION_TIMER,
  MAX_ROUNDS
} from '@/utils/triviaConstants';

export const useRoundTransition = (
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setShowRoundBridge: React.Dispatch<React.SetStateAction<boolean>>,
  mockQuestionsData: any[],
  questionsPerRound: number
) => {
  const [nextNarrator, setNextNarrator] = useState<string>('');
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1);
  const [showRoundBridge, setShowRoundBridgeState] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState(false);

  /* one helper -------------------------------------------------------------- */
  const getNewRoundQuestions = (nextRound: number): TriviaQuestion[] =>
    mockQuestionsData
      .slice(0, QUESTIONS_PER_ROUND)
      .map(q => ({ ...q, id: `r${nextRound}-${q.id}` }));

  /* exactly what useTriviaGame expects -------------------------------------- */
  const startNextRound = (narratorId: string, nextRound: number): Round => {
    console.log(
      '[useRoundTransition] Spawning round',
      nextRound,
      'with narrator',
      narratorId
    );

    const newRound: Round = {
      roundNumber: nextRound,
      narratorId,
      questions: getNewRoundQuestions(nextRound),
      currentQuestionIndex: 0,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    };

    // Hide the bridge for everyone
    setShowRoundBridge(false);
    // Reset helper state
    setNextNarrator('');
    return newRound;
  };

  /* ------------------------------------------------------------------------ */
  return {
    /* bridge helpers requested by other hooks */
    nextNarrator,
    setNextNarrator,
    nextRoundNumber,
    setNextRoundNumber,
    gameOver,
    setGameOver,
    showRoundBridge,
    setShowRoundBridge,
    getNewRoundQuestions,
    startNextRound
  };
};
