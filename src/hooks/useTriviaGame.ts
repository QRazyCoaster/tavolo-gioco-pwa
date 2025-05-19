/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { useRoundManager } from './useRoundManager';
import { useRoundProgress } from './useRoundProgress';
import { usePlayerActions } from './usePlayerActions';
import { useNarratorActions } from './useNarratorActions';
import { useGameChannel } from './useGameChannel';
import { useBroadcastListeners } from './useBroadcastListeners';
import { useNarratorSubscription } from './useNarratorSubscription';
import { useTimerControl } from './useTimerControl';
import { useQuestionState } from './useQuestionState';

export const useTriviaGame = () => {
  const { state, dispatch } = useGame();
  const hostId = state.players.find(p => p.isHost)?.id || '';

  /* ───────── Round management hooks ───────── */
  const {
    currentRound,
    setCurrentRound,
    answeredPlayers,
    setAnsweredPlayers,
    showPending,
    setShowPending,
    setupNewRound
  } = useRoundManager(hostId);

  /* ───────── Round progression hooks ───────── */
  const {
    showRoundBridge,
    setShowRoundBridge,
    nextNarrator,
    setNextNarrator,
    nextRoundNumber,
    setNextRoundNumber,
    gameOver,
    setGameOver,
    handleNextQuestion
  } = useRoundProgress(
    currentRound, 
    setCurrentRound,
    state.players,
    setAnsweredPlayers,
    setShowPending
  );

  /* ───────── Game state values ───────── */
  const gameChannelRef = useGameChannel(state.gameId);
  const isNarrator = state.currentPlayer?.id === currentRound.narratorId;
  const hasAnswered = !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id);

  /* ───────── Start next round function ───────── */
  const beginNextRound = useCallback(() => {
    if (!nextNarrator) return;
    // Create new round with the next narrator
    const newRound = setupNewRound(nextNarrator, nextRoundNumber);
    // Update state with the new round
    setCurrentRound(newRound);
    setAnsweredPlayers(new Set());
    setShowPending(false);
    // Hide the bridge & keep nextNarrator until the bridge disappears
    setShowRoundBridge(false);
    setNextNarrator('');
  }, [nextNarrator, nextRoundNumber, setupNewRound, setCurrentRound, setAnsweredPlayers, setShowPending, setShowRoundBridge, setNextNarrator]);

  /* ───────── Question state information ───────── */
  const { currentQuestion, questionNumber, totalQuestions } = useQuestionState(currentRound);

  /* ───────── Timer control for narrator ───────── */
  useTimerControl(
    isNarrator,
    showRoundBridge,
    gameOver,
    setCurrentRound,
    handleNextQuestion
  );

  /* ───────── Subscription and broadcast hooks ───────── */
  useBroadcastListeners(
    gameChannelRef.current,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPending,
    setNextNarrator,
    setShowRoundBridge,
    setGameOver,
    dispatch,
    state.gameId,
    currentRound
  );

  useNarratorSubscription(
    isNarrator,
    state.gameId,
    currentRound,
    setCurrentRound,
    setShowPending,
    state.players
  );

  /* ───────── Player and narrator action hooks ───────── */
  const { handlePlayerBuzzer } = usePlayerActions(
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.questions,
    setAnsweredPlayers,
    setCurrentRound,
    setShowPending
  );

  const { 
    handleCorrectAnswer, 
    handleWrongAnswer, 
    handleNextQuestion: narratorNext 
  } = useNarratorActions(
    state,
    currentRound,
    setCurrentRound,
    gameChannelRef.current,
    setAnsweredPlayers,
    setShowPending,
    setShowRoundBridge,
    setGameOver,
    dispatch,
    isNarrator
  );

  /* ───────── exported API ───────── */
  return {
    currentRound,
    isNarrator,
    hasPlayerAnswered: hasAnswered,
    currentQuestion,
    questionNumber,
    totalQuestions,
    playerAnswers: currentRound.playerAnswers,
    timeLeft: currentRound.timeLeft,

    showPendingAnswers: showPending,
    setShowPendingAnswers: setShowPending,

    handlePlayerBuzzer,
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion,

    showRoundBridge,
    nextNarrator: state.players.find(p => p.id === nextNarrator),
    nextRoundNumber,
    startNextRound: beginNextRound,
    gameOver
  };
};
