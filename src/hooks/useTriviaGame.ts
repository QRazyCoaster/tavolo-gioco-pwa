/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { useGame } from '@/context/GameContext';
import { Round } from '@/types/trivia';
import {
  mockQuestions,
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND
} from '@/utils/triviaConstants';
import {
  setGameChannel,
  broadcastNextQuestion,
  broadcastRoundEnd,
  broadcastScoreUpdate,
  cleanupChannel
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

  /* ────────────────────────────────────────────────────────── */
  /*  Round & question state                                   */
  /* ────────────────────────────────────────────────────────── */
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

  const isNarrator        = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id);

  /* ────────────────────────────────────────────────────────── */
  /*  Next narrator helper                                     */
  /* ────────────────────────────────────────────────────────── */
  const getNextNarrator = useCallback(() => {
    if (currentRound.roundNumber >= state.players.length) {
      return { nextNarratorId: state.players[0].id, isGameOver: true };
    }
    return {
      nextNarratorId: state.players[currentRound.roundNumber]?.id || state.players[0].id,
      isGameOver: false
    };
  }, [currentRound.roundNumber, state.players]);

  /* ────────────────────────────────────────────────────────── */
  /*  Game channel & listeners                                 */
  /* ────────────────────────────────────────────────────────── */
  const gameChannelRef = useGameChannel(state.gameId);

  useBroadcastListeners(
    gameChannelRef.current,
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

  useNarratorSubscription(
    isNarrator,
    state.gameId,
    currentRound,
    setCurrentRound,
    setShowPendingAnswers,
    state.players
  );

  /* ────────────────────────────────────────────────────────── */
  /*  Advance question locally helper                          */
  /* ────────────────────────────────────────────────────────── */
  const advanceQuestionLocally = (idx: number) => {
    setCurrentRound(prev => ({
      ...prev,
      currentQuestionIndex: idx,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    }));
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
  };

  /* ────────────────────────────────────────────────────────── */
  /*  Question manager & actions                               */
  /* ────────────────────────────────────────────────────────── */
  const { currentQuestion, questionNumber, totalQuestions } = useQuestionManager(
    currentRound,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    (idx, scores) => broadcastNextQuestion(idx, state.players, scores)
  );

  const { handlePlayerBuzzer } = usePlayerActions(
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.questions,
    setAnsweredPlayers,
    setCurrentRound,
    setShowPendingAnswers
  );

  const {
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion,
    handleTimeUp
  } = useNarratorActions(
    currentRound.roundNumber,
    currentRound.currentQuestionIndex,
    getNextNarrator,
    advanceQuestionLocally,
    setNextNarrator,
    setShowRoundBridge,
    setCurrentRound,
    setGameOver
  );

  /* ────────────────────────────────────────────────────────── */
  /*  Narrator timer                                           */
  /* ────────────────────────────────────────────────────────── */
  useNarratorTimer(
    isNarrator,
    showRoundBridge,
    gameOver,
    setCurrentRound,
    handleTimeUp
  );

  /* ────────────────────────────────────────────────────────── */
  /*  Round bridge / transition                                */
  /* ────────────────────────────────────────────────────────── */
  const { startNextRound } = useRoundTransition(
    currentRound.roundNumber,
    state.players,
    getNextNarrator
  );

  const continueToNextRound = () => {
    setShowRoundBridge(false);
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);

    const newRound = startNextRound(nextNarrator, currentRound.roundNumber + 1);
    setCurrentRound(newRound);

    broadcastScoreUpdate(state.players);
  };

  /* ----------------------------------------------------------------------- */
  return {
    currentRound,
    isNarrator,
    hasPlayerAnswered,
    currentQuestion,
    questionNumber,
    totalQuestions,
    playerAnswers: currentRound.playerAnswers,
    timeLeft: currentRound.timeLeft,
    showPendingAnswers,
    setShowPendingAnswers,
    handlePlayerBuzzer,
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion,
    showRoundBridge,
    nextNarrator: state.players.find(p => p.id === nextNarrator),
    nextRoundNumber: currentRound.roundNumber + 1,
    startNextRound: continueToNextRound,
    gameOver
  };
};
