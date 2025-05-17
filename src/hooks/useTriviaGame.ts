
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { useGame } from '@/context/GameContext';
import { Round } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
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
  const { toast } = useToast();
  const { language } = useLanguage();

  /* ------------------------------------------------------------------ */
  /*  Round / question state                                            */
  /* ------------------------------------------------------------------ */
  const [currentRound, setCurrentRound] = useState<Round>({
    roundNumber: 1,
    narratorId: state.players.find(p => p.isHost)?.id || '',
    questions: mockQuestions.slice(0, QUESTIONS_PER_ROUND),
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER
  });

  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set());
  const [showPendingAnswers, setShowPendingAnswers] = useState(false);
  const [showRoundBridge, setShowRoundBridge] = useState(false);
  const [nextNarrator, setNextNarrator] = useState<string>('');

  const narratorSubscriptionRef = useRef<any>(null);
  const gameChannelRef          = useRef<any>(null);

  const isNarrator        = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = state.currentPlayer
    ? answeredPlayers.has(state.currentPlayer.id)
    : false;

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const getNextNarrator = useCallback(() => {
    if (currentRound.roundNumber >= state.players.length) {
      return state.players.find(p => p.isHost)?.id || '';
    }
    return state.players[currentRound.roundNumber]?.id || state.players[0].id;
  }, [currentRound.roundNumber, state.players]);

  const advanceQuestionLocally = (nextIdx: number) => {
    setCurrentRound(prev => ({
      ...prev,
      currentQuestionIndex: nextIdx,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    }));
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
  };

  /* ------------------------------------------------------------------ */
  /*  Question-manager, player actions, narrator actions                 */
  /* ------------------------------------------------------------------ */
  const {
    currentQuestion,
    questionNumber,
    totalQuestions
  } = useQuestionManager(
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

  /* ------------------------------------------------------------------ */
  /*  Open ONE shared channel per game                                   */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!state.gameId) return;

    if (!gameChannelRef.current) {
      const ch = supabase.channel(`game-${state.gameId}`).subscribe();
      gameChannelRef.current = ch;
      setGameChannel(ch);
    }

    return () => {
      cleanupChannel();
      gameChannelRef.current = null;
    };
  }, [state.gameId]);

  /* ------------------------------------------------------------------ */
  /*  Broadcast listeners (NEXT_QUESTION, SCORE_UPDATE, ROUND_END)       */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!gameChannelRef.current) return;

    const ch = gameChannelRef.current;

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

      if (scores) {
        scores.forEach((s: any) =>
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
        );
      }
    });

    ch.on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
      const { scores } = payload as any;
      scores.forEach((s: any) =>
        dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
      );
    });

    ch.on('broadcast', { event: 'ROUND_END' }, ({ payload }) => {
      const { nextRound, nextNarratorId, scores } = payload as any;

      if (scores) {
        scores.forEach((s: any) =>
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
        );
      }

      setNextNarrator(nextNarratorId);
      setShowRoundBridge(true);

      setTimeout(() => {
        setCurrentRound(prev => ({
          ...prev,
          roundNumber: nextRound,
          narratorId: nextNarratorId,
          currentQuestionIndex: 0,
          playerAnswers: [],
          timeLeft: QUESTION_TIMER
        }));
      }, 6500);
    });

    return () => { /* listeners stay for life of channel */ };
  }, [dispatch]);

  /* ------------------------------------------------------------------ */
  /*  Narrator listens for buzzer INSERTs                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!isNarrator || !state.gameId) {
      if (narratorSubscriptionRef.current) {
        supabase.removeChannel(narratorSubscriptionRef.current);
        narratorSubscriptionRef.current = null;
      }
      return;
    }

    // re-create subscription when narrator changes
    if (narratorSubscriptionRef.current) {
      supabase.removeChannel(narratorSubscriptionRef.current);
      narratorSubscriptionRef.current = null;
    }

    const dbChannel = supabase
      .channel(`player_answers_${state.gameId}`)
      .on('postgres_changes',
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
                {
                  playerId: player.id,
                  playerName: player.name,
                  timestamp: Date.now()
                }
              ]
            };
          });
          setShowPendingAnswers(true);
        })
      .subscribe();

    narratorSubscriptionRef.current = dbChannel;

    return () => { void supabase.removeChannel(dbChannel); };
  }, [
    isNarrator,
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.narratorId,
    currentRound.questions,
    state.players
  ]);

  /* ------------------------------------------------------------------ */
  /*  Narrator-side timer                                               */
  /* ------------------------------------------------------------------ */
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

  const startNextRound = () => {
    setShowRoundBridge(false);
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
