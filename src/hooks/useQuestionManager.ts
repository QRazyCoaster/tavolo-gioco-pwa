
import { useState } from 'react';
import { TriviaQuestion, Round } from '@/types/trivia';
import { mockQuestions, QUESTION_TIMER, QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';
import { playAudio } from '@/utils/audioUtils';

export const useQuestionManager = (
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  broadcastNextQuestion: (nextIndex: number) => void
) => {
  const advanceQuestionLocally = (nextIndex: number) => {
    // Update local state to move to the next question
    setCurrentRound(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    }));
    
    // Reset the list of players who have answered
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
  };

  const handleNextQuestion = () => {
    playAudio('notification');
    return currentRound.currentQuestionIndex;
  };

  return {
    advanceQuestionLocally,
    handleNextQuestion,
    currentQuestion: currentRound.questions[currentRound.currentQuestionIndex],
    questionNumber: currentRound.currentQuestionIndex + 1,
    totalQuestions: QUESTIONS_PER_ROUND,
  };
};
