/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { Round } from '@/types/trivia';
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
import { useRoundTransition } from './useRoundTransition';

export const useTriviaGame = () => {
  const { state, dispatch } = useGame();

  /* ── round state ─────────────────────────────────────────── */
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

  /* helpers, channels, subscriptions (unchanged)… */

  /* ── clear queue helper 🔶 ─────────────────────────── */
  const clearAnswerQueue = () =>
    setCurrentRound(prev => ({ ...prev, playerAnswers: [] }));

  /* ── player & narrator actions set-up (unchanged)…   */

  /* return object with new queue-clearing wrappers 🔶── */
  return {
    /* …other props… */
    handleCorrectAnswer: (pid: string) => {
      handleCorrectAnswer(pid);
      clearAnswerQueue();           // 🔶 hides panel immediately
      setShowPendingAnswers(false);
    },
    handleWrongAnswer: (pid: string) => {
      handleWrongAnswer(pid);
      clearAnswerQueue();           // 🔶
      setShowPendingAnswers(false);
    },
    /* …rest unchanged… */
  };
};
