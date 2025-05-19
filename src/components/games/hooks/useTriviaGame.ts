
import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { useLanguage } from '@/context/LanguageContext';
import { mockTriviaQuestions } from '../data/mockTriviaQuestions';
import { usePlayerActions } from './usePlayerActions';
import { useNarratorControls } from './useNarratorControls';
import { useQuestionFlow } from './useQuestionFlow';
import { TriviaQuestionType } from '../types/triviaTypes';

export const useTriviaGameState = () => {
  const { state } = useGame();
  const { language } = useLanguage();
  
  // Player actions
  const { handlePlayerBuzz } = usePlayerActions();
  
  // Narrator controls
  const { handleAssignPoint, handleRemovePlayerFromQueue } = useNarratorControls();
  
  // Question flow
  const { handleRevealAnswer, handleShowQuestion, handleNextQuestion } = useQuestionFlow();
  
  // Local state
  const [questions] = useState<TriviaQuestionType[]>(mockTriviaQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [waitingForNarrator, setWaitingForNarrator] = useState<boolean>(false);
  const [queuedPlayers, setQueuedPlayers] = useState<any[]>([]);
  
  // Check if current user is the narrator for this round
  const isCurrentNarrator = state.currentPlayer?.isHost || false;
  const currentQuestion = questions[currentQuestionIndex];

  // Effect for showing the first question
  useEffect(() => {
    setWaitingForNarrator(!isCurrentNarrator);
  }, [isCurrentNarrator]);
  
  // Wrapper functions that pass the required state
  const handlePlayerBuzzWrapper = () => {
    handlePlayerBuzz(queuedPlayers, setQueuedPlayers);
  };
  
  const handleAssignPointWrapper = (player: any) => {
    if (!isCurrentNarrator) return;
    handleAssignPoint(player, queuedPlayers, setQueuedPlayers);
  };
  
  const handleRemovePlayerFromQueueWrapper = (playerId: string) => {
    if (!isCurrentNarrator) return;
    handleRemovePlayerFromQueue(playerId, queuedPlayers, setQueuedPlayers, state.players);
  };
  
  const handleRevealAnswerWrapper = () => {
    if (!isCurrentNarrator) return;
    handleRevealAnswer(setShowAnswer);
  };
  
  const handleShowQuestionWrapper = () => {
    if (!isCurrentNarrator) return;
    handleShowQuestion(setWaitingForNarrator, setQueuedPlayers);
  };
  
  const handleNextQuestionWrapper = () => {
    if (!isCurrentNarrator) return;
    handleNextQuestion(
      currentQuestionIndex,
      questions,
      setCurrentQuestionIndex,
      roundNumber,
      setRoundNumber,
      setShowAnswer,
      setQueuedPlayers,
      setWaitingForNarrator
    );
  };
  
  // Get sorted players by score
  const sortedPlayers = [...state.players].sort((a, b) => 
    (b.score || 0) - (a.score || 0)
  );
  
  return {
    questions,
    currentQuestionIndex,
    showAnswer,
    roundNumber,
    waitingForNarrator,
    queuedPlayers,
    isCurrentNarrator,
    currentQuestion,
    sortedPlayers,
    handlePlayerBuzz: handlePlayerBuzzWrapper,
    handleAssignPoint: handleAssignPointWrapper,
    handleRemovePlayerFromQueue: handleRemovePlayerFromQueueWrapper,
    handleRevealAnswer: handleRevealAnswerWrapper,
    handleShowQuestion: handleShowQuestionWrapper,
    handleNextQuestion: handleNextQuestionWrapper,
    setWaitingForNarrator
  };
};
