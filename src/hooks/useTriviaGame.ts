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

  const gameChannelRef = useGameChannel(state.gameId);

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

  const isNarrator = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id);

  const handleNextQuestion = useCallback(() => {
    const currentIndex = currentRound.currentQuestionIndex;
    const isLastQuestion = currentIndex >= QUESTIONS_PER_ROUND - 1;

    if (isLastQuestion) {
      if (currentRound.roundNumber >= MAX_ROUNDS) {
        broadcastRoundEnd(
          currentRound.roundNumber,
          '',
          state.players,
          true
        );
        setShowRoundBridge(true);
        setTimeout(() => {
          setGameOver(true);
        }, 6500);
      } else {
        const sorted = [...state.players].sort(
          (a, b) => (a.narrator_order || 999) - (b.narrator_order || 999)
        );
        const currentIndex = sorted.findIndex(p => p.id === currentRound.narratorId);
        const nextId = sorted[(currentIndex + 1) % sorted.length]?.id || sorted[0].id;

        setNextNarrator(nextId);
        setNextRoundNumber(currentRound.roundNumber + 1);

        broadcastRoundEnd(
          currentRound.roundNumber,
          nextId,
          state.players
        );

        setShowRoundBridge(true);
      }
    } else {
      const nextIndex = currentIndex + 1;

      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);

      broadcastNextQuestion(nextIndex, state.players);
    }
  }, [
    currentRound,
    state.players,
    setCurrentRound,
    setShowRoundBridge,
    setGameOver,
    setNextNarrator,
    setNextRoundNumber
  ]);

  useNarratorTimer(
    isNarrator,
    showRoundBridge,
    gameOver,
    setCurrentRound,
    handleNextQuestion
  );

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

  const {
    handleCorrectAnswer,
    handleWrongAnswer
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
    handleCorrectAnswer: (pid: string) => {
      handleCorrectAnswer(pid);
    },
    handleWrongAnswer: (pid: string) => {
      handleWrongAnswer(pid);
    },
    handleNextQuestion,
    showRoundBridge,
    nextNarrator: state.players.find(p => p.id === nextNarrator),
    nextRoundNumber,
    startNextRound,
    gameOver
  };
};
