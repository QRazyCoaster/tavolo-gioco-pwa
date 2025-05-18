/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { Round, TriviaQuestion } from '@/types/trivia';
import {
  mockQuestions,
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND,
  MAX_ROUNDS
} from '@/utils/triviaConstants';
import {
  broadcastNextQuestion,
  broadcastRoundEnd,
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
    // Use mockQuestions that now have the required properties
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

  /* ──────────── hooks initialization ──────────��── */
  
  // Initialize the game channel
  const gameChannelRef = useGameChannel(state.gameId);
  const gameChannel = gameChannelRef.current;

  // Question and timer management
  const { 
    currentQuestion, 
    questionNumber, 
    totalQuestions,
  } = useQuestionManager(currentRound);
  
  // Get next narrator function - need to define this here since it needs access to state
  const getNextNarrator = useCallback(() => {
    // Default to first player if something goes wrong
    if (!state.players.length) {
      return { nextNarratorId: '', isGameOver: true };
    }

    // Check if we've reached the maximum number of rounds
    if (currentRound.roundNumber >= MAX_ROUNDS) {
      return { nextNarratorId: '', isGameOver: true };
    }

    // Choose next narrator (simple round-robin)
    const nextNarratorIndex = currentRound.roundNumber % state.players.length;
    const nextNarratorId = state.players[nextNarratorIndex]?.id || state.players[0].id;
    return { nextNarratorId, isGameOver: false };
  }, [state.players, currentRound.roundNumber]);

  // Round transitions
  const { 
    setShowRoundBridge: setShowRoundBridgeInternal,
    nextRoundNumber,
    setNextRoundNumber,
    setNextNarrator: setNextNarratorInternal,
    setGameOver: setGameOverInternal,
    startNextRound: startNextRoundFn
  } = useRoundTransition(
    currentRound,
    setCurrentRound,
    setShowRoundBridge,
    mockQuestions,
    QUESTIONS_PER_ROUND
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

  // Player actions
  const { 
    handlePlayerBuzzer 
  } = usePlayerActions(
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.questions,
    setAnsweredPlayers,
    setCurrentRound,
    setShowPendingAnswers
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

  // Handle starting the next round
  const startNextRound = useCallback(() => {
    startNextRoundFn();
  }, [startNextRoundFn]);

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
