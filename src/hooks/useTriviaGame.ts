
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { useGame } from '@/context/GameContext';
import { Round } from '@/types/trivia';
import {
  mockQuestions,
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND,
  MIN_SCORE_LIMIT
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
  const [showRoundBridge, setShowRoundBridge] = useState(false);
  const [nextNarrator, setNextNarrator] = useState('');
  const [gameOver, setGameOver] = useState(false); // New game over state

  const narratorSubRef = useRef<any>(null);
  const gameChannelRef = useRef<any>(null);

  const isNarrator = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = !!state.currentPlayer && answeredPlayers.has(state.currentPlayer.id);

  /* helper to pick next narrator ------------------------------------------------ */
  const getNextNarrator = useCallback(() => {
    // Game is over if we've gone through all players as narrators
    if (currentRound.roundNumber >= state.players.length) {
      console.log("[useTriviaGame] Game will end after this round - last narrator reached");
      return { nextNarratorId: state.players[0].id, isGameOver: true };
    }
    return { 
      nextNarratorId: state.players[currentRound.roundNumber]?.id || state.players[0].id,
      isGameOver: false 
    };
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
    setCurrentRound,
    setGameOver // Pass the new setGameOver function
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

    ch.on('broadcast', { event: 'ROUND_END' }, ({ payload }) => {
      const { nextRound, nextNarratorId, scores, isGameOver } = payload as any;
      scores?.forEach((s: any) =>
        dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
      );

      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      setNextNarrator(nextNarratorId);
      
      // Handle game over state
      if (isGameOver) {
        console.log("[useTriviaGame] Game over received from broadcast");
        setTimeout(() => {
          setGameOver(true);
        }, 6500); // Wait for round bridge to complete
      } else {
        setShowRoundBridge(true);
      }

      setTimeout(() => {
        if (!isGameOver) {
          const newQuestions = mockQuestions
            .slice(0, QUESTIONS_PER_ROUND)
            .map(q => ({ ...q, id: `r${nextRound}-${q.id}` }));

          setCurrentRound({
            roundNumber: nextRound,
            narratorId: nextNarratorId,
            questions: newQuestions,
            currentQuestionIndex: 0,
            playerAnswers: [],
            timeLeft: QUESTION_TIMER
          });
        }
      }, 6500);
    });

    return () => { /* listeners live for lifetime of channel */ };
  }, [dispatch, currentRound.currentQuestionIndex]);

  /* narrator subscription for buzz INSERTS (kept for redundancy) -------------- */
  useEffect(() => {
    if (!isNarrator || !state.gameId) {
      narratorSubRef.current && supabase.removeChannel(narratorSubRef.current);
      narratorSubRef.current = null;
      return;
    }

    narratorSubRef.current && supabase.removeChannel(narratorSubRef.current);

    const dbCh = supabase
      .channel(`buzzes_${state.gameId}_${currentRound.currentQuestionIndex}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'player_answers' },
        ({ new: row }: any) => {
          if (row.game_id !== state.gameId) return;
          const currentQ = currentRound.questions[currentRound.currentQuestionIndex]?.id;
          if (row.question_id !== currentQ) return;

          console.log(`[useTriviaGame] Received DB notification for player_answer: ${row.player_id}`);
          
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
  }, [
    isNarrator,
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.narratorId,
    currentRound.questions,
    state.players
  ]);

  /* narrator timer ------------------------------------------------------------- */
  useEffect(() => {
    if (!isNarrator || showRoundBridge || gameOver) return;
    const t = setInterval(() => {
      setCurrentRound(prev => {
        const tl = Math.max(0, prev.timeLeft - 1);
        if (tl === 0) handleTimeUp();
        return { ...prev, timeLeft: tl };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isNarrator, showRoundBridge, gameOver]);

  /* bridge continue ----------------------------------------------------------- */
  const startNextRound = () => {
    setShowRoundBridge(false);
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
    setCurrentRound(prev => ({ ...prev, narratorId: nextNarrator }));
    broadcastScoreUpdate(state.players);
  };

  /* exports ------------------------------------------------------------------- */
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
    startNextRound,
    gameOver
  };
};
