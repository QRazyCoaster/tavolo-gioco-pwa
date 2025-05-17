/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react';
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

  /* ──────────────────────────────────────────────────────────
     Round & question state
  ────────────────────────────────────────────────────────── */
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

  const [answeredPlayers,      setAnsweredPlayers]      = useState<Set<string>>(new Set());
  const [showPendingAnswers,   setShowPendingAnswers]   = useState(false);
  const [nextNarrator,         setNextNarrator]         = useState('');
  const [showRoundBridge,      setShowRoundBridge]      = useState(false);
  const [gameOver,             setGameOver]             = useState(false);

  const isNarrator        = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id);

  /* helper: decide next narrator ------------------------------------------- */
  const getNextNarrator = useCallback(() => {
    if (currentRound.roundNumber >= state.players.length) {
      return { nextNarratorId: state.players[0].id, isGameOver: true };
    }
    return {
      nextNarratorId: state.players[currentRound.roundNumber]?.id || state.players[0].id,
      isGameOver: false
    };
  }, [currentRound.roundNumber, state.players]);

  /* game channel ----------------------------------------------------------- */
  const gameChannelRef = useGameChannel(state.gameId);

  /* round-transition helper ------------------------------------------------ */
  const {
    setShowRoundBridge: setShowRoundBridgeRT,
    startNextRound: startNextRoundRT
  } = useRoundTransition(
    currentRound.roundNumber,
    state.players,
    getNextNarrator
  );

  /* broadcast listeners ---------------------------------------------------- */
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

  /* narrator subscription (buzzes) ---------------------------------------- */
  useNarratorSubscription(
    isNarrator,
    state.gameId,
    currentRound,
    setCurrentRound,
    setShowPendingAnswers,
    state.players
  );

  /* question manager ------------------------------------------------------- */
  const { currentQuestion, questionNumber, totalQuestions } = useQuestionManager(
    currentRound,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    (idx, scores) => broadcastNextQuestion(idx, state.players, scores)
  );

  /* player actions (buzz) -------------------------------------------------- */
  const { handlePlayerBuzzer } = usePlayerActions(
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.questions,
    setAnsweredPlayers,
    setCurrentRound,
    setShowPendingAnswers
  );

  /* clear queue helper (hides thumbs panel fast) --------------------------- */
  const clearAnswerQueue = () =>
    setCurrentRound(prev => ({ ...prev, playerAnswers: [] }));

  /* narrator actions (score, next, time-up) -------------------------------- */
  const {
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion,
    handleTimeUp
  } = useNarratorActions(
    currentRound.roundNumber,
    currentRound.currentQuestionIndex,
    getNextNarrator,
    (idx: number) => {
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: idx,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
    },
    setNextNarrator,
    setShowRoundBridge,
    setCurrentRound,
    setGameOver
  );

  /* narrator timer --------------------------------------------------------- */
  useNarratorTimer(
    isNarrator,
    showRoundBridge,
    gameOver,
    setCurrentRound,
    handleTimeUp
  );

  /* bridge “continue” handler --------------------------------------------- */
  const startNextRoundHandler = () => {
    setShowRoundBridge(false);
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);

    const newRound = startNextRoundRT(nextNarrator, currentRound.roundNumber + 1);
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
    /* wrappers clear the queue immediately */
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
    nextNarrator: state.players.find(p => p.id === nextNarrator),
    nextRoundNumber: currentRound.roundNumber + 1,
    startNextRound: startNextRoundHandler,
    gameOver
  };
};
