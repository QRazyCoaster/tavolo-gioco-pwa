// src/hooks/useTriviaGame.ts
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { useRoundManager } from './useRoundManager';
import { useRoundProgress } from './useRoundProgress';
import { useQuestionState } from './useQuestionState';
import { usePlayerActions } from './usePlayerActions';
import { useNarratorActions } from './useNarratorActions';
import { useGameChannel } from './useGameChannel';
import { useBroadcastListeners } from './useBroadcastListeners';
import { useNarratorSubscription } from './useNarratorSubscription';
import { useTimerControl } from './useTimerControl';

export const useTriviaGame = () => {
  const { state, dispatch } = useGame();
  const hostId = state.players.find(p => p.isHost)?.id ?? '';

  // ───────── Round management ─────────
  const {
    currentRound,
    setCurrentRound,
    answeredPlayers,
    setAnsweredPlayers,
    showPendingAnswers,
    setShowPendingAnswers,
    setupNewRound,
  } = useRoundManager(hostId);

  // ───────── Round progression ─────────
  const {
    showRoundBridge,
    setShowRoundBridge,
    nextNarrator,
    setNextNarrator,
    nextRoundNumber,
    setNextRoundNumber,
    gameOver,
    setGameOver,
    handleNextQuestion,
  } = useRoundProgress(
    currentRound,
    setCurrentRound,
    state.players,
    setAnsweredPlayers,
    setShowPendingAnswers
  );

  // ───────── Subscriptions & broadcasts ─────────
  const gameChannel = useGameChannel(state.gameId).current;
  useBroadcastListeners(
    gameChannel,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setNextNarrator,
    setShowRoundBridge,
    setGameOver,
    dispatch,
    state.gameId,
    currentRound
  );

  const isNarrator = state.currentPlayer?.id === currentRound.narratorId;
  useNarratorSubscription(
    isNarrator,
    state.gameId,
    currentRound,
    setCurrentRound,
    setShowPendingAnswers,
    state.players
  );

  // ───────── Question state ─────────
  const { currentQuestion, questionNumber, totalQuestions } =
    useQuestionState(currentRound);

  // ───────── Player & Narrator actions ─────────
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
  } = useNarratorActions(
    state,
    currentRound,
    setCurrentRound,
    gameChannel,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setShowRoundBridge,
    setGameOver,
    dispatch,
    isNarrator
  );

  // ───────── Timer (narrator only) ─────────
  useTimerControl(
    isNarrator,
    showRoundBridge,
    gameOver,
    setCurrentRound,
    handleNextQuestion
  );

  // ───────── Start next round (called by RoundBridgePage) ─────────
  const startNextRound = useCallback(() => {
    if (!nextNarrator) return;
    const newRound = setupNewRound(nextNarrator, nextRoundNumber);
    setCurrentRound(newRound);
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
    setShowRoundBridge(false);
    setNextNarrator('');
  }, [
    nextNarrator,
    nextRoundNumber,
    setupNewRound,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setShowRoundBridge,
    setNextNarrator,
  ]);

  return {
    currentRound,
    isNarrator,
    hasPlayerAnswered:
      !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id),
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
    nextNarrator:
      state.players.find((p) => p.id === nextNarrator) ?? null,
    nextRoundNumber,
    startNextRound,

    gameOver,
  };
};
