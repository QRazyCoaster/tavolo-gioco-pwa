
import { useState } from 'react';
import { TriviaQuestion, Round } from '@/types/trivia';
import { QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';
import { playAudio } from '@/utils/audioUtils';

export const useQuestionManager = (currentRound: Round) => {
  const handleNextQuestion = () => {
    playAudio('notification');
    return currentRound.currentQuestionIndex;
  };

  // Defensive programming - ensure we never return undefined
  const safeCurrentQuestion: TriviaQuestion = currentRound.questions[currentRound.currentQuestionIndex] || {
    id: 'fallback',
    question: 'Loading question...',
    correct_answer: '',
    category: '',
    language: 'en' as const
  };

  return {
    currentQuestion: safeCurrentQuestion,
    questionNumber: currentRound.currentQuestionIndex + 1,
    totalQuestions: QUESTIONS_PER_ROUND,
    handleNextQuestion
  };
};
