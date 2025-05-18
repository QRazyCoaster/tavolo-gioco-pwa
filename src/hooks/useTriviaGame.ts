/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { Round } from '@/types/trivia';
import {
  mockQuestions,
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND
} from '@/utils/triviaConstants';
import {
  broadcastNextQuestion,
  broadcastScoreUpdate
} from '@/utils/triviaBroadcast';
import { useQuestionManager } from './useQuestionManager';
import { usePlayerActions } from './usePlayerActions';
import { useNarratorActions } from './useNarratorActions';
import { useGameChannel } from './useGameChannel';
import { useBroadcastListeners } from './useBroadcastListeners';
import { useNarratorSubscription } from './useNarratorSubscription';
import { useNarratorTimer } from './useNarratorTimer';
import { useRoundTransition } from './useRoundTransition';

export const useTriviaGame = () => {
  const { state, dispatch } = useGame();

  /* ── round state ─────────────────────────────────────────── */
  const [currentRound, setCurrentRound] = useState<Round>({
    roundNumber: 1,
    narratorId: state.players.find(p => p.isHost)?.id || '',
    questions: mockQuestions
      .slice(0, QUESTIONS_PER_ROUND)
      .map(q => ({ ...q, id: `r1-${q.id}` })),
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER
  });

  const [answeredPlayers,    setAnsweredPlayers]    = useState<Set<string>>(new Set());
  const [showPendingAnswers, setShowPendingAnswers] = useState(false);
  const [showRoundBridge,    setShowRoundBridge]    = useState(false);
  const [nextNarrator,       setNextNarrator]       = useState('');
  const [gameOver,           setGameOver]           = useState(false);

  // Fix: Ensure isNarrator is correctly detecting the narrator status
  const isNarrator = state.currentPlayer && 
                    state.currentPlayer.id === currentRound.narratorId;
  
  const hasPlayerAnswered = !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id);

  /* ── clear queue helper ─────────────────────────── */
  const clearAnswerQueue = useCallback(() => {
    setCurrentRound(prev => ({ ...prev, playerAnswers: [] }));
  }, []);

  /* ──────────── hooks initialization ───────────── */
  
  // Initialize the game channel
  const gameChannel = useGameChannel(state.gameId);

  // Question and timer management
  const { 
    currentQuestion, 
    questionNumber, 
    totalQuestions,
  } = useQuestionManager(currentRound);
  
  // Player actions
  const { 
    handlePlayerBuzzer 
  } = usePlayerActions(
    state, 
    currentRound, 
    setAnsweredPlayers, 
    gameChannel
  );

  // Narrator actions
  const { 
    handleCorrectAnswer, 
    handleWrongAnswer, 
    handleNextQuestion 
  } = useNarratorActions(
    state, 
    currentRound, 
    setCurrentRound, 
    gameChannel, 
    setAnsweredPlayers, 
    setShowPendingAnswers,
    setShowRoundBridge,
    setGameOver,
    dispatch
  );

  // Keep track of time
  const { 
    timeLeft 
  } = useNarratorTimer(
    isNarrator, 
    currentRound, 
    setCurrentRound, 
    handleNextQuestion
  );

  // Listen for broadcasts from other players
  useBroadcastListeners(
    gameChannel,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setNextNarrator,
    setShowRoundBridge,
    setGameOver,
    dispatch,
    mockQuestions,
    QUESTIONS_PER_ROUND
  );

  // Subscribe to database changes if narrator
  useNarratorSubscription(
    !!isNarrator,
    state.gameId,
    currentRound,
    setCurrentRound,
    setShowPendingAnswers,
    state.players
  );

  // Handle round transitions
  const { 
    startNextRound, 
    nextRoundNumber 
  } = useRoundTransition(
    currentRound,
    setCurrentRound,
    setShowRoundBridge,
    mockQuestions,
    QUESTIONS_PER_ROUND
  );

  /* ── Debug logs ─────────────────────────────────── */
  console.log('[useTriviaGame] Current round:', currentRound);
  console.log('[useTriviaGame] Is narrator:', isNarrator);
  console.log('[useTriviaGame] Current player:', state.currentPlayer);
  console.log('[useTriviaGame] Question number/total:', questionNumber, totalQuestions);
  
  /* ── return the game state and actions ─────────── */
  return {
    currentRound,
    isNarrator,
    hasPlayerAnswered,
    currentQuestion,
    questionNumber,
    totalQuestions,
    playerAnswers: currentRound.playerAnswers,
    timeLeft,
    showPendingAnswers,
    setShowPendingAnswers,
    handlePlayerBuzzer,
    handleCorrectAnswer: (pid: string) => {
      handleCorrectAnswer(pid);
      clearAnswerQueue();
      setShowPendingAnswers(false);
    },
    handleWrongAnswer: (pid: string) => {
      handleWrongAnswer(pid);
      clearAnswerQueue();
      setShowPendingAnswers(false);
    },
    handleNextQuestion,
    showRoundBridge,
    nextNarrator,
    nextRoundNumber,
    startNextRound,
    gameOver
  };
};
