import { useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Round } from '@/types/trivia';
import { GameState } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import {
  broadcastNextQuestion,
  broadcastRoundEnd,
  broadcastScoreUpdate
} from '@/utils/triviaBroadcast';
import { MAX_ROUNDS } from '@/utils/triviaConstants';

/* ------------------------------------------------------------------ */
/*  Point values                                                       */
/* ------------------------------------------------------------------ */
export const CORRECT_ANSWER_POINTS = 10;
export const WRONG_ANSWER_POINTS   = -5;

/* ------------------------------------------------------------------ */
/*  Main hook                                                          */
/* ------------------------------------------------------------------ */
export const useNarratorActions = (
  state: GameState,
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  gameChannel: RealtimeChannel | null,
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  setShowRoundBridge: React.Dispatch<React.SetStateAction<boolean>>,
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>,
  dispatch: any
) => {
  /* ──────────────────────────────────────────────────────────────────
     Award points for a correct answer
  ────────────────────────────────────────────────────────────────── */
  const handleCorrectAnswer = useCallback(
    (playerId: string) => {
      if (!state.currentPlayer?.isHost) return;

      const player = state.players.find(p => p.id === playerId);
      if (!player) return;

      playAudio('success');

      const newScore = (player.score || 0) + CORRECT_ANSWER_POINTS;
      dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });

      const updatedPlayers = state.players.map(p =>
        p.id === playerId ? { ...p, score: newScore } : p
      );
      broadcastScoreUpdate(updatedPlayers);

      /* remove that player from the local queue immediately */
      setCurrentRound(prev => ({
        ...prev,
        playerAnswers: prev.playerAnswers.filter(a => a.playerId !== playerId)
      }));
      setShowPendingAnswers(false);

      /* short pause so everyone sees the thumbs-up flash, then advance */
      setTimeout(() => {
        const nextIdx = currentRound.currentQuestionIndex + 1;
        broadcastNextQuestion(nextIdx, updatedPlayers);
        setCurrentRound(prev => ({
          ...prev,
          currentQuestionIndex: nextIdx,
          playerAnswers: [],
          timeLeft: 90
        }));
        setAnsweredPlayers(new Set());
      }, 300);
    },
    [
      state.currentPlayer,
      state.players,
      currentRound.currentQuestionIndex,
      setCurrentRound,
      dispatch,
      setAnsweredPlayers,
      setShowPendingAnswers
    ]
  );

  /* ──────────────────────────────────────────────────────────────────
     Deduct points for a wrong answer
  ────────────────────────────────────────────────────────────────── */
  const handleWrongAnswer = useCallback(
    (playerId: string) => {
      if (!state.currentPlayer?.isHost) return;

      const player = state.players.find(p => p.id === playerId);
      if (!player) return;

      playAudio('error');

      const newScore = (player.score || 0) + WRONG_ANSWER_POINTS;
      dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });

      const updatedPlayers = state.players.map(p =>
        p.id === playerId ? { ...p, score: newScore } : p
      );
      broadcastScoreUpdate(updatedPlayers);

      /* remove from queue locally */
      setCurrentRound(prev => ({
        ...prev,
        playerAnswers: prev.playerAnswers.filter(a => a.playerId !== playerId)
      }));
      setShowPendingAnswers(false);

      /* if nobody left → immediate advance */
      if (currentRound.playerAnswers.length <= 1) {
        const nextIdx = currentRound.currentQuestionIndex + 1;
        setTimeout(() => {
          broadcastNextQuestion(nextIdx, updatedPlayers);
          setCurrentRound(prev => ({
            ...prev,
            currentQuestionIndex: nextIdx,
            playerAnswers: [],
            timeLeft: 90
          }));
          setAnsweredPlayers(new Set());
        }, 300);
      }
    },
    [
      state.currentPlayer,
      state.players,
      currentRound.playerAnswers.length,
      currentRound.currentQuestionIndex,
      setCurrentRound,
      dispatch,
      setAnsweredPlayers,
      setShowPendingAnswers
    ]
  );

  /* ──────────────────────────────────────────────────────────────────
     Manual "Next question"   (also used by timer expiry)
  ────────────────────────────────────────────────────────────────── */
  const handleNextQuestion = useCallback(() => {
    if (!state.currentPlayer?.isHost) return;

    const idx = currentRound.currentQuestionIndex;
    const total = currentRound.questions.length;

    /*  still questions left in this round  */
    if (idx < total - 1) {
      const nextIdx = idx + 1;
      broadcastNextQuestion(nextIdx, state.players);
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: nextIdx,
        playerAnswers: [],
        timeLeft: 90
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      return;
    }

    /*  round finished  — determine next narrator or end game  */
    const narratorOrder = [...state.players].sort(
      (a, b) => (a.narrator_order || 999) - (b.narrator_order || 999)
    );
    const currentIx = narratorOrder.findIndex(p => p.id === currentRound.narratorId);
    const nextIx    = (currentIx + 1) % narratorOrder.length;
    const nextNarratorId = narratorOrder[nextIx].id;

    const isFinalRound = currentRound.roundNumber >= MAX_ROUNDS;
    broadcastRoundEnd(currentRound.roundNumber, nextNarratorId, state.players, isFinalRound);

    setShowRoundBridge(true);

    if (isFinalRound) {
      setTimeout(() => setGameOver(true), 6500);
    }
  },
  [
    state.currentPlayer,
    state.players,
    currentRound.currentQuestionIndex,
    currentRound.questions.length,
    currentRound.roundNumber,
    currentRound.narratorId,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setShowRoundBridge,
    setGameOver
  ]);

  /* ------------------------------------------------------------------ */
  return { handleCorrectAnswer, handleWrongAnswer, handleNextQuestion };
};
