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

export const useTriviaGame = () => {
  const { state, dispatch } = useGame();

  /* ────────────────────────────────────────────────────────── */
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
  const [showRoundBridge,  setShowRoundBridge]  = useState(false);
  const [nextNarrator,     setNextNarrator]     = useState('');

  const narratorSubRef = useRef<any>(null);
  const gameChannelRef = useRef<any>(null);

  const isNarrator = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id);

  /* helper to pick next narrator ------------------------------------------------ */
  const getNextNarrator = useCallback(() => {
    if (currentRound.roundNumber >= state.players.length) {
      return state.players.find(p => p.isHost)?.id || '';
    }
    return state.players[currentRound.roundNumber]?.id || state.players[0].id;
  }, [currentRound.roundNumber, state.players]);

  const advanceQuestionLocally = (idx: number) => {
    setCurrentRound(prev => ({
      ...prev,
      currentQuestionIndex: idx,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    }));
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
  };

  /* question manager & actions -------------------------------------------------- */
  const { currentQuestion, questionNumber, totalQuestions } = useQuestionManager(
    currentRound,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    (idx, scores) => broadcastNextQuestion(idx, state.players, scores)
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
    handleWrongAnswer,
    handleNextQuestion,
    handleTimeUp
  } = useNarratorActions(
    currentRound.roundNumber,
    currentRound.currentQuestionIndex,
    getNextNarrator,
    advanceQuestionLocally,
    setNextNarrator,
    setShowRoundBridge,
    setCurrentRound
  );

  /* open one shared channel ----------------------------------------------------- */
  useEffect(() => {
    if (!state.gameId || gameChannelRef.current) return;
    const ch = supabase.channel(`game-${state.gameId}`).subscribe();
    gameChannelRef.current = ch;
    setGameChannel(ch);
    return () => {
      cleanupChannel();
      gameChannelRef.current = null;
    };
  }, [state.gameId]);

  /* broadcast listeners --------------------------------------------------------- */
  useEffect(() => {
    const ch = gameChannelRef.current;
    if (!ch) return;

    ch.on('broadcast', { event: 'NEXT_QUESTION' }, ({ payload }) => {
      const { questionIndex, scores } = payload as any;
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: questionIndex,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      scores?.forEach((s: any) =>
        dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
      );
    });

    ch.on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
      payload.scores.forEach((s: any) =>
        dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
      );
    });

    /* 🔔 NEW: BUZZ broadcast so narrator never misses the first buzz */
    ch.on('broadcast', { event: 'BUZZ' }, ({ payload }) => {
      const { playerId, playerName, questionIndex } = payload as any;
      if (questionIndex !== currentRound.currentQuestionIndex) return;

      setCurrentRound(prev => {
        if (prev.playerAnswers.some(a => a.playerId === playerId)) return prev;
        return {
          ...prev,
          playerAnswers: [
            ...prev.playerAnswers,
            { playerId, playerName, timestamp: Date.now() }
          ]
        };
      });
      setShowPendingAnswers(true);
    });

    ch.on('broadcast', { event:
