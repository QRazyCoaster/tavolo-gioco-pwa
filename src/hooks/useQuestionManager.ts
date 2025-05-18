import { useState } from 'react';
import { TriviaQuestion, Round } from '@/types/trivia';
import {
  mockQuestions,
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND
} from '@/utils/triviaConstants';
import { playAudio } from '@/utils/audioUtils';

/**
 * Manages the question flow for the current round.
 */
export const useQuestionManager = (
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  broadcastNextQuestion: (nextIndex: number) => void
) => {
  /* ── SAFETY GUARD ───────────────────────────────────────────── */
  /* `questions` may be undefined for one render during init.      */
  const questions: TriviaQuestion[] = currentRound?.questions ?? [];
  const safeIndex = Math.max(
    0,
    Math.min(currentRound.currentQuestionIndex, questions.length - 1)
  );
  /* ───────────────────────────────────────────────────────────── */

  /* advance locally (used by narrator actions) */
  const advanceQuestionLocally = (nextIndex: number) => {
    setCurrentRound(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    }));

    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
  };

  /* optional helper if you want to use it directly */
  const handleNextQuestion = () => {
    playAudio('notification');
    const nextIdx = safeIndex + 1;
    advanceQuestionLocally(nextIdx);
    broadcastNextQuestion(nextIdx);
  };

  return {
    advanceQuestionLocally,
    handleNextQuestion,
    currentQuestion:
      questions[safeIndex] ??
      ({
        id: 'loading',
        textEn: 'Loading…',
        textIt: 'Caricamento…',
        answerEn: '',
        answerIt: '',
        categoryId: '',
        difficulty: 'easy'
      } as TriviaQuestion),
    questionNumber: safeIndex + 1,
    totalQuestions: QUESTIONS_PER_ROUND
  };
};
