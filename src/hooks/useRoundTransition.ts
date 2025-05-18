
import { useState } from 'react';
import { Round, TriviaQuestion } from '@/types/trivia';
import {
  mockQuestions,
  QUESTIONS_PER_ROUND,
  QUESTION_TIMER
} from '@/utils/triviaConstants';

/** Handles everything that happens **between** rounds */
export const useRoundTransition = (
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setShowRoundBridge?: React.Dispatch<React.SetStateAction<boolean>>,
  mockQuestionsParam?: any[],
  questionsPerRound?: number
) => {
  /* ───────────────────────────────── state ─────────────────────────────── */
  const [nextNarrator, setNextNarrator] = useState<string>('');
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1);
  const [showRoundBridge, setShowRoundBridgeInternal] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Use the internally managed state if no external state manager is provided
  const effectiveSetShowRoundBridge = setShowRoundBridge || setShowRoundBridgeInternal;

  /* ───────────────────────── helpers ───────────────────────────────────── */
  const getNewRoundQuestions = (round: number): TriviaQuestion[] =>
    (mockQuestionsParam || mockQuestions)
      .slice(0, questionsPerRound || QUESTIONS_PER_ROUND)
      .map(q => ({ ...q, id: `r${round}-${q.id}` }));

  /** Called from the bridge-page countdown in *every* tab */
  const startNextRound = (): void => {
    if (!nextNarrator) return;                         // safety guard

    console.log('[useRoundTransition] Spawning round', nextRoundNumber,
                'with narrator', nextNarrator);

    setCurrentRound({
      roundNumber: nextRoundNumber,
      narratorId: nextNarrator,
      questions: getNewRoundQuestions(nextRoundNumber),
      currentQuestionIndex: 0,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    });

    /* hide the bridge & reset helper state */
    effectiveSetShowRoundBridge(false);
    setNextNarrator('');
  };

  /* ───────────────────────── exposed API ───────────────────────────────── */
  return {
    nextNarrator, setNextNarrator,
    nextRoundNumber, setNextRoundNumber,
    showRoundBridge, setShowRoundBridge: effectiveSetShowRoundBridge,
    gameOver, setGameOver,
    getNewRoundQuestions,
    startNextRound
  };
};
