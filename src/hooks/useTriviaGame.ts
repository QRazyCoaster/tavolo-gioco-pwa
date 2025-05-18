
import { useState, useCallback, useRef } from 'react';
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
  broadcastScoreUpdate,
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
  const [showRoundBridge, setShowRoundBridge] = useState<boolean>(false);

  const gameChannelRef = useGameChannel(state.gameId);

  // Calculate these values before using them
  const isNarrator = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id);

  // ─── Round Transition Setup ───
  const {
    nextNarrator,
    setNextNarrator,
    nextRoundNumber,
    setNextRoundNumber,
    gameOver,
    setGameOver,
    startNextRound
  } = useRoundTransition(
    currentRound,
    setCurrentRound,
    setShowRoundBridge
  );

  // ───── Next Question Logic ─────
  const handleNextQuestion = useCallback(() => {
    if (!isNarrator) return;
    
    const idx = currentRound.currentQuestionIndex;
    const last = idx >= QUESTIONS_PER_ROUND - 1;

    if (last) {
      if (currentRound.roundNumber >= MAX_ROUNDS) {
        // end of game
        broadcastRoundEnd(currentRound.roundNumber, '', state.players, true);
        setShowRoundBridge(true);
        setTimeout(() => setGameOver(true), 6500);
      } else {
        // end of round → next narrator
        const sorted = [...state.players].sort((a, b) =>
          (a.narrator_order || 999) - (b.narrator_order || 999)
        );
        const curIx = sorted.findIndex(p => p.id === currentRound.narratorId);
        const nextId = sorted[(curIx + 1) % sorted.length]?.id || sorted[0].id;

        setNextNarrator(nextId);
        setNextRoundNumber(currentRound.roundNumber + 1);
        broadcastRoundEnd(currentRound.roundNumber, nextId, state.players, false);
        setShowRoundBridge(true);
      }
    } else {
      // simply advance question
      const nextIdx = idx + 1;
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: nextIdx,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      broadcastNextQuestion(nextIdx, state.players);
    }
  }, [
    isNarrator,
    currentRound,
    state.players,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setShowRoundBridge,
    setGameOver,
    setNextNarrator,
    setNextRoundNumber
  ]);

  // ───── Timer (narrator only) ─────
  useNarratorTimer(
    isNarrator,
    showRoundBridge,
    gameOver,
    setCurrentRound,
    handleNextQuestion
  );

  // ───── Listen for broadcasts ─────
  useBroadcastListeners(
    gameChannelRef.current
  );

  // ───── Supabase INSERT listener ─────
  useNarratorSubscription(
    isNarrator,
    state.gameId,
    currentRound,
    setCurrentRound,
    setShowPendingAnswers,
    state.players
  );

  // ───── Question Manager ─────
  const { currentQuestion, questionNumber, totalQuestions } = useQuestionManager(
    currentRound,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    (i: number) => broadcastNextQuestion(i, state.players)
  );

  // ───── Player buzzing ─────
  const { handlePlayerBuzzer } = usePlayerActions(
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.questions,
    setAnsweredPlayers,
    setCurrentRound,
    setShowPendingAnswers
  );

  // ───── Assign / detract points ─────
  const { handleCorrectAnswer, handleWrongAnswer } = useNarratorActions(
    state,
    currentRound,
    setCurrentRound,
    gameChannelRef.current,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setShowRoundBridge,
    setGameOver,
    dispatch,
    isNarrator
  );

  // ───── Expose to page ─────
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
    handleCorrectAnswer: (pid: string) => handleCorrectAnswer(pid),
    handleWrongAnswer: (pid: string) => handleWrongAnswer(pid),
    handleNextQuestion,
    showRoundBridge,
    nextNarrator: state.players.find(p => p.id === nextNarrator) || null,
    nextRoundNumber,
    startNextRound,
    gameOver
  };
};
