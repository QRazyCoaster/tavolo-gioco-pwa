
import { useState } from 'react';
import { TriviaQuestion, Round } from '@/types/trivia';
import { QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';
import { playAudio } from '@/utils/audioUtils';

export const useQuestionManager = (currentRound: Round) => {
  const handleNextQuestion = () => {
    playAudio('notification');
    return currentRound.currentQuestionIndex;
  };

  // Add safety check for currentQuestion
  const currentQuestion = currentRound.questions?.[currentRound.currentQuestionIndex];
  
  if (!currentQuestion) {
    console.warn('[useQuestionManager] No question found at index:', currentRound.currentQuestionIndex, 'Questions:', currentRound.questions);
  }

  return {
    currentQuestion: currentQuestion || {
      id: 'loading',
      categoryId: '',
      textEn: '',
      textIt: 'Loading question...',
      answerEn: '',
      answerIt: 'Loading...',
      difficulty: 'medium' as const
    },
    questionNumber: currentRound.currentQuestionIndex + 1,
    totalQuestions: QUESTIONS_PER_ROUND,
    handleNextQuestion
  };
};
