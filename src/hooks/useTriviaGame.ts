/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { Round, TriviaQuestion } from '@/types/trivia';
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

export const useTriviaGame = () => {
  const { state, dispatch } = useGame();

  /* ───────────────── round state ───────────────── */
  const [currentRound, setCurrentRound] = useState<Round>({
    roundNumber: 1,
    narratorId: state.players.find(p => p.isHost)?.id || '', // might be ''
    questions: mockQuestions
      .slice(0, QUESTIONS_PER_ROUND)
      .map(q => ({ ...q, id: `r1-${q.id}` })) as TriviaQuestion[],
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER
  });

  /* when players finally load, fix missing narratorId ------------ */
  useEffect(() => {
    if (!currentRound.narratorId && state.players.length) {
      const host = state.players.find(p => p.isHost) || state.players[0];
      setCurrentRound(prev => ({ ...prev, narratorId: host.id }));
    }
  }, [state.players, currentRound.narratorId]);

  /* ───────────────── misc local state ───────────────── */
  const [answeredPlayers,    setAnsweredPlayers]    = useState<Set<string>>(new Set());
  const [showPendingAnswers, setShowPendingAnswers] = useState(false);
  const [showRoundBridge,    setShowRoundBridge]    = useState(false);
  const [nextNarrator,       setNextNarrator]       = useState('');
  const [gameOver,           setGameOver]           = useState(false);

  const isNarrator        =
    !!state.currentPlayer && state.currentPlayer.id === currentRound.narratorId;
  const hasPlayerAnswered =
    !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id);

  /* ───────────────── game channel & listeners ───────────────── */
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

  /* ───────────────── helpers ───────────────── */
  const clearAnswerQueue = () =>
    setCurrentRound(prev => ({ ...prev, playerAnswers: [] }));

  /* ───────────────── question manager ───────────────── */
  const {
    currentQuestion,
    questionNumber,
    totalQuestions
  } = useQuestionManager(
    currentRound,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    (idx: number) => broadcastNextQuestion(idx, state.players)
  );

  /* ───────────────── player & narrator actions ───────────────── */
  const { handlePlayerBuzzer } = usePlayerActions(
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.questions,
    setAnsweredPlayers,
    setCurrentRound,
    setShowPendingAnswers
  );

  const {
    handleCorrectAnswer: origCorrect,
    handleWrongAnswer:   origWrong,
    handleNextQuestion
  } = useNarratorActions(
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

  /* clear panel immediately after judgement */
  const handleCorrectAnswer = useCallback((pid: string) => {
    origCorrect(pid);
    clearAnswerQueue();
    setShowPendingAnswers(false);
  }, [origCorrect]);

  const handleWrongAnswer = useCallback((pid: string) => {
    origWrong(pid);
    clearAnswerQueue();
    setShowPendingAnswers(false);
  }, [origWrong]);

  /* ───────────────── narrator timer ───────────────── */
  useNarratorTimer(
    isNarrator,
    showRoundBridge,
    gameOver,
    setCurrentRound,
    () => handleNextQuestion()      // time-up == next-question
  );

  /* ───────────────── public API ───────────────── */
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
    startNextRound: () => {
      /* this is still delegated to useBroadcastListeners, so just close the bridge */
      setShowRoundBridge(false);
      broadcastScoreUpdate(state.players);
    },
    gameOver
  };
};
