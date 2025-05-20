
import { useState } from 'react';
import { TriviaQuestion, Round } from '@/types/trivia';
import { QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';
import { playAudio } from '@/utils/audioUtils';

export const useQuestionManager = (currentRound: Round) => {
  const handleNextQuestion = () => {
    playAudio('notification');
    return currentRound.currentQuestionIndex;
  };

  return {
    currentQuestion: currentRound.questions[currentRound.currentQuestionIndex],
    questionNumber: currentRound.currentQuestionIndex + 1,
    totalQuestions: QUESTIONS_PER_ROUND,
    handleNextQuestion
  };
};
