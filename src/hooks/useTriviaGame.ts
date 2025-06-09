
// src/hooks/useTriviaGame.ts
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useState, useEffect }       from 'react';
import { useGame }           from '@/context/GameContext';
import { Round }             from '@/types/trivia';
import {
  mockQuestions,
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND
} from '@/utils/triviaConstants';
import {
  broadcastNextQuestion,
  broadcastRoundEnd
} from '@/utils/triviaBroadcast';
import { useRoundManager }    from './useRoundManager';
import { useRoundProgress }   from './useRoundProgress';
import { useQuestionManager } from './useQuestionManager';
import { usePlayerActions }   from './usePlayerActions';
import { useNarratorActions } from './useNarratorActions';
import { useGameChannel }     from './useGameChannel';
import { useBroadcastListeners } from './useBroadcastListeners';
import { useNarratorSubscription } from './useNarratorSubscription';
import { useNarratorTimer }   from './useNarratorTimer';

export const useTriviaGame = () => {
  const { state, dispatch } = useGame();

  // ───────── Round state & helpers ─────────
  const hostId = state.players.find(p => p.isHost)?.id ?? '';
  const {
    currentRound,
    setCurrentRound,
    answeredPlayers,
    setAnsweredPlayers,
    showPendingAnswers,
    setShowPendingAnswers,
    loadQuestionsForNewRound,
    questionsLoaded,
    questionsError
  } = useRoundManager(hostId);

  // ───────── Eliminated players state ─────────
  const [eliminatedPlayers, setEliminatedPlayers] = useState<Set<string>>(new Set());

  // Reset eliminated players when question changes
  useEffect(() => {
    setEliminatedPlayers(new Set());
  }, [currentRound.currentQuestionIndex, currentRound.roundNumber]);

  // ───────── Round progression ─────────
  const {
    showRoundBridge,
    setShowRoundBridge,
    nextNarrator,
    nextRoundNumber,
    setNextRoundNumber,
    gameOver,
    setGameOver,
    setNextNarrator,
    handleNextQuestion,
    startNextRound
  } = useRoundProgress(
    currentRound,
    setCurrentRound,
    state.players,
    setAnsweredPlayers,
    setShowPendingAnswers,
    loadQuestionsForNewRound
  );

  // ───────── Channel & listeners ─────────
  const gameChannelRef = useGameChannel(state.gameId);

  useBroadcastListeners(
    gameChannelRef.current,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setNextNarrator,
    setShowRoundBridge,
    setNextRoundNumber,
    setGameOver,
    dispatch,
    state.gameId,
    currentRound,
    setEliminatedPlayers
  );

  useNarratorSubscription(
    state.currentPlayer?.id === currentRound.narratorId,
    state.gameId,
    currentRound,
    setCurrentRound,
    setShowPendingAnswers,
    state.players
  );

  // ───────── Question state ─────────
  const { currentQuestion, questionNumber, totalQuestions } =
    useQuestionManager(currentRound);

  // ───────── Player & Narrator actions ─────────
  const { handlePlayerBuzzer } = usePlayerActions(
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.questions,
    setAnsweredPlayers,
    setCurrentRound,
    setShowPendingAnswers
  );

  const { handleCorrectAnswer, handleWrongAnswer } = useNarratorActions(
    currentRound.roundNumber,
    currentRound.currentQuestionIndex,
    (nextIndex) => {
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
    },
    setCurrentRound,
    state.players,
    handleNextQuestion
  );

  // ───────── Narrator timer ─────────
  useNarratorTimer(
    state.currentPlayer?.id === currentRound.narratorId,
    showRoundBridge,
    gameOver,
    setCurrentRound,
    handleNextQuestion
  );

  // Calculate current player's position in the answer queue
  const currentPlayerId = state.currentPlayer?.id ?? '';
  // Sort playerAnswers by timestamp and filter out eliminated players
  const sortedPlayerAnswers = [...currentRound.playerAnswers]
    .sort((a, b) => a.timestamp - b.timestamp)
    .filter(answer => !eliminatedPlayers.has(answer.playerId));
  
  const playerQueuePosition = sortedPlayerAnswers.findIndex(
    answer => answer.playerId === currentPlayerId
  );
  const isFirstInQueue = playerQueuePosition === 0;
  const hasAnswered = answeredPlayers.has(currentPlayerId);
  const isEliminated = eliminatedPlayers.has(currentPlayerId);

  return {
    currentRound,
    isNarrator: state.currentPlayer?.id === currentRound.narratorId,
    hasPlayerAnswered: hasAnswered,
    isFirstInQueue: hasAnswered && isFirstInQueue && !isEliminated,
    isEliminated,
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
    nextNarrator: state.players.find(p => p.id === nextNarrator) ?? null,
    nextRoundNumber,
    startNextRound,
    gameOver,
    questionsLoaded,
    questionsError,
  };
};
