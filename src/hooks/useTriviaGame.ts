/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { Round } from '@/types/trivia';
import {
  mockQuestions,
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND,
  MAX_ROUNDS
} from '@/utils/triviaConstants';
import {
  broadcastNextQuestion,
  broadcastRoundEnd
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

  /* ───────── current‐round state ───────── */
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

  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set());
  const [showPendingAnswers, setShowPendingAnswers] = useState(false);

  const gameChannelRef = useGameChannel(state.gameId);
  const isNarrator = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id);

  const {
    showRoundBridge,
    setShowRoundBridge,
    nextNarrator,
    setNextNarrator,
    nextRoundNumber,
    setNextRoundNumber,
    gameOver,
    setGameOver,
    getNewRoundQuestions,
    startNextRound
  } = useRoundTransition(
    currentRound,
    setCurrentRound,
    setShowRoundBridge,
    mockQuestions,
    QUESTIONS_PER_ROUND
  );

  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex;
    const last = idx >= QUESTIONS_PER_ROUND - 1;

    if (last) {
      if (currentRound.roundNumber >= MAX_ROUNDS) {
        broadcastRoundEnd(currentRound.roundNumber, '', state.players, true);
        setShowRoundBridge(true);
        setTimeout(() => setGameOver(true), 6500);
      } else {
        const order = [...state.players].sort((a, b) => (a.narrator_order ?? 999) - (b.narrator_order ?? 999));
        const curIx = order.findIndex(p => p.id === currentRound.narratorId);
        const nextId = order[(curIx + 1) % order.length]?.id || order[0].id;
        setNextNarrator(nextId);
        setNextRoundNumber(currentRound.roundNumber + 1);
        broadcastRoundEnd(currentRound.roundNumber, nextId, state.players);
        setShowRoundBridge(true);
      }
    } else {
      const next = idx + 1;
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: next,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      broadcastNextQuestion(next, state.players);
    }
  }, [
    currentRound,
    state.players,
    setCurrentRound,
    setShowPendingAnswers,
    setShowRoundBridge,
    setGameOver,
    setNextNarrator,
    setNextRoundNumber
  ]);

  useNarratorTimer(isNarrator, showRoundBridge, gameOver, setCurrentRound, handleNextQuestion);

  // ← updated call: last two args are gameId + currentRound
  useBroadcastListeners(
    gameChannelRef.current,
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

  useNarratorSubscription(
    isNarrator,
    state.gameId,
    currentRound,
    setCurrentRound,
    setShowPendingAnswers,
    state.players
  );

  const { currentQuestion, questionNumber, totalQuestions } = useQuestionManager(
    currentRound,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    (idx: number) => broadcastNextQuestion(idx, state.players)
  );

  const { handlePlayerBuzzer } = usePlayerActions(
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.questions,
    setAnsweredPlayers,
    setCurrentRound,
    setShowPendingAnswers
  );

  const { handleCorrectAnswer, handleWrongAnswer } = useNarratorActions(
    state,
    currentRound,
    setCurrentRound,
    gameChannelRef.current,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setShowRoundBridge,
    setGameOver,
    dispatch
  );

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
    nextRoundNumber,
    startNextRound,
    gameOver
  };
};
