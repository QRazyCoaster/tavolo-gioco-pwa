/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { Round } from '@/types/trivia';
import {
  mockQuestions, QUESTION_TIMER, QUESTIONS_PER_ROUND, MAX_ROUNDS
} from '@/utils/triviaConstants';
import { broadcastNextQuestion, broadcastRoundEnd } from '@/utils/triviaBroadcast';
import { useQuestionManager }   from './useQuestionManager';
import { usePlayerActions }     from './usePlayerActions';
import { useNarratorActions }   from './useNarratorActions';
import { useGameChannel }       from './useGameChannel';
import { useBroadcastListeners } from './useBroadcastListeners';
import { useNarratorSubscription } from './useNarratorSubscription';
import { useNarratorTimer }     from './useNarratorTimer';
import { useRoundTransition }   from './useRoundTransition';

export const useTriviaGame = () => {
  const { state, dispatch } = useGame();

  /* ── round state ───────────────────────────────────────── */
  const [currentRound, setCurrentRound] = useState<Round>({
    roundNumber: 1,
    narratorId: state.players.find(p => p.isHost)?.id || '',
    questions: mockQuestions.slice(0, QUESTIONS_PER_ROUND)
      .map(q => ({ ...q, id: `r1-${q.id}` })),
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER
  });
  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set());
  const [showPending, setShowPending] = useState(false);

  /* ── channels & helpers ────────────────────────────────── */
  const gameChannelRef = useGameChannel(state.gameId);
  const isNarrator     = state.currentPlayer?.id === currentRound.narratorId;
  const hasAnswered    = !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id);

  /* ── round-transition logic (new hook API) ─────────────── */
  const {
    showRoundBridge,   setShowRoundBridge,
    nextNarrator,      setNextNarrator,
    nextRoundNumber,   setNextRoundNumber,
    gameOver,          setGameOver,
    startNextRound
  } = useRoundTransition(mockQuestions);

  /* ── next-question / end-of-round handler ──────────────── */
  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex;
    const last = idx >= QUESTIONS_PER_ROUND - 1;

    if (last) {
      /* ---- round finished ---- */
      if (currentRound.roundNumber >= MAX_ROUNDS) {
        // final round → game over
        broadcastRoundEnd(currentRound.roundNumber, '', state.players, true);
        setShowRoundBridge(true);
        setTimeout(() => setGameOver(true), 6500);
      } else {
        // pick next narrator in join-order
        const order = [...state.players]
          .sort((a,b) => (a.narrator_order ?? 999) - (b.narrator_order ?? 999));
        const curIx = order.findIndex(p => p.id === currentRound.narratorId);
        const nextId = order[(curIx + 1) % order.length].id;

        setNextNarrator(nextId);
        setNextRoundNumber(currentRound.roundNumber + 1);
        broadcastRoundEnd(currentRound.roundNumber, nextId, state.players);
        setShowRoundBridge(true);
      }
    } else {
      /* ---- same round, just advance ---- */
      const next = idx + 1;
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: next,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      setAnsweredPlayers(new Set());
      setShowPending(false);
      broadcastNextQuestion(next, state.players);
    }
  }, [currentRound, state.players]);

  /* ── timer (uses the bridge/game-over guards) ──────────── */
  useNarratorTimer(
    isNarrator,
    showRoundBridge,
    gameOver,
    setCurrentRound,
    handleNextQuestion          // time-up ⇒ act like “next”
  );

  /* ── the remaining helper hooks stay unchanged ────────── */
  useBroadcastListeners(
    gameChannelRef.current,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPending,
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
    setShowPending,
    state.players
  );

  const { currentQuestion, questionNumber, totalQuestions } =
    useQuestionManager(
      currentRound,
      setCurrentRound,
      setAnsweredPlayers,
      setShowPending,
      idx => broadcastNextQuestion(idx, state.players)
    );

  const { handlePlayerBuzzer } = usePlayerActions(
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.questions,
    setAnsweredPlayers,
    setCurrentRound,
    setShowPending
  );

  const { handleCorrectAnswer, handleWrongAnswer } = useNarratorActions(
    state,
    currentRound,
    setCurrentRound,
    gameChannelRef.current,
    setAnsweredPlayers,
    setShowPending,
    setShowRoundBridge,
    setGameOver,
    dispatch
  );

  /* ── exported API for components ───────────────────────── */
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
    startNextRound,
    gameOver
  };
};
