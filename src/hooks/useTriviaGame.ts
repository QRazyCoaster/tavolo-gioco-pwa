
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { useGame } from '@/context/GameContext';
import { Round } from '@/types/trivia';
import { mockQuestions, QUESTION_TIMER, QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';
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

  /* ──────────────────────────────────────────────────────────
     Round & question state
  ────────────────────────────────────────────────────────── */
  const [currentRound, setCurrentRound] = useState<Round>({
    roundNumber: 1,
    narratorId: state.players.find(p => p.isHost)?.id || '',
    questions: mockQuestions.slice(0, QUESTIONS_PER_ROUND),
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER
  });

  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set());
  const [showPendingAnswers, setShowPendingAnswers]   = useState(false);
  const [showRoundBridge,  setShowRoundBridge]        = useState(false);
  const [nextNarrator,     setNextNarrator]           = useState('');
  const narratorSubRef  = useRef<any>(null);
  const gameChannelRef  = useRef<any>(null);

  const isNarrator        = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id);

  /* ──────────────────────────────────────────────────────────
     Determine next narrator
  ────────────────────────────────────────────────────────── */
  const getNextNarrator = useCallback(() => {
    if (currentRound.roundNumber >= state.players.length) {
      return state.players.find(p => p.isHost)?.id || '';
    }
    return state.players[currentRound.roundNumber]?.id || state.players[0].id;
  }, [currentRound.roundNumber, state.players]);

  /* ──────────────────────────────────────────────────────────
     Question helpers
  ────────────────────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────────────────────
     Question manager / actions
  ────────────────────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────────────────────
     Single game channel
  ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!state.gameId || gameChannelRef.current) return;
    const ch = supabase.channel(`game-${state.gameId}`).subscribe();
    setGameChannel(ch);
    gameChannelRef.current = ch;
    return () => {
      cleanupChannel();
      gameChannelRef.current = null;
    };
  }, [state.gameId]);

  /* ──────────────────────────────────────────────────────────
     Broadcast listeners
  ────────────────────────────────────────────────────────── */
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

    ch.on('broadcast', { event: 'ROUND_END' }, ({ payload }) => {
      const { nextRound, nextNarratorId, scores } = payload as any;

      scores?.forEach((s: any) =>
        dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
      );

      /* NEW: clear answered set immediately so buzzers reset */
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);

      setNextNarrator(nextNarratorId);
      setShowRoundBridge(true);

      // prepare next round after bridge
      setTimeout(() => {
        setCurrentRound({
          roundNumber: nextRound,
          narratorId: nextNarratorId,
          questions: mockQuestions.slice(0, QUESTIONS_PER_ROUND),
          currentQuestionIndex: 0,
          playerAnswers: [],
          timeLeft: QUESTION_TIMER
        });
      }, 6500);
    });

    return () => { /* listeners live for channel life-time */ };
  }, [dispatch]);

  /* ──────────────────────────────────────────────────────────
     Narrator subscription for buzzes
  ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isNarrator || !state.gameId) {
      narratorSubRef.current && supabase.removeChannel(narratorSubRef.current);
      narratorSubRef.current = null;
      return;
    }

    // re-subscribe whenever narrator changes
    narratorSubRef.current && supabase.removeChannel(narratorSubRef.current);

    const dbCh = supabase
      .channel(`buzzes_${state.gameId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'player_answers' },
        ({ new: row }: any) => {
          if (row.game_id !== state.gameId) return;
          const currentQ = currentRound.questions[currentRound.currentQuestionIndex]?.id;
          if (row.question_id !== currentQ) return;

          setCurrentRound(prev => {
            if (prev.playerAnswers.some(a => a.playerId === row.player_id)) return prev;
            const player = state.players.find(p => p.id === row.player_id);
            if (!player) return prev;
            return {
              ...prev,
              playerAnswers: [
                ...prev.playerAnswers,
                { playerId: player.id, playerName: player.name, timestamp: Date.now() }
              ]
            };
          });
          setShowPendingAnswers(true);
        }
      )
      .subscribe();

    narratorSubRef.current = dbCh;
    return () => { void supabase.removeChannel(dbCh); };
  }, [isNarrator, currentRound.currentQuestionIndex, currentRound.narratorId]);

  /* Narrator timer */
  useEffect(() => {
    if (!isNarrator || showRoundBridge) return;
    const t = setInterval(() => {
      setCurrentRound(prev => {
        const tl = Math.max(0, prev.timeLeft - 1);
        if (tl === 0) handleTimeUp();
        return { ...prev, timeLeft: tl };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isNarrator, showRoundBridge]);

  /* Round-bridge “Continue” */
  const startNextRound = () => {
    setShowRoundBridge(false);
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
    setCurrentRound(prev => ({ ...prev, narratorId: nextNarrator }));
    broadcastScoreUpdate(state.players);
  };

  /* ------------------------------------------------------------------ */
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
    startNextRound
  };
};
