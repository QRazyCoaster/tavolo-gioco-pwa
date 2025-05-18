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

export const CORRECT_ANSWER_POINTS = 10;
export const WRONG_ANSWER_POINTS   = -5;

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
  /* ──────────────────────────────────────────────────────────── */
  /*  Helper: advance to next question or go to round-end logic   */
  /* ──────────────────────────────────────────────────────────── */
  const advanceQuestion = (updatedPlayers: any[]) => {
    const idx   = currentRound.currentQuestionIndex;
    const total = currentRound.questions.length;

    /* last question of this round → reuse full round-end logic */
    if (idx >= total - 1) {
      handleNextQuestion();          // triggers round bridge / game over check
      return;
    }

    /* otherwise just bump index */
    const nextIdx = idx + 1;
    broadcastNextQuestion(nextIdx, updatedPlayers);
    setCurrentRound(prev => ({
      ...prev,
      currentQuestionIndex: nextIdx,
      playerAnswers: [],
      timeLeft: 90
    }));
    setAnsweredPlayers(new Set());
  };

  /* ──────────────────────────────────────────────────────────── */
  const handleCorrectAnswer = useCallback((playerId: string) => {
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

    /* remove from queue & hide thumbs */
    setCurrentRound(prev => ({
      ...prev,
      playerAnswers: prev.playerAnswers.filter(a => a.playerId !== playerId)
    }));
    setShowPendingAnswers(false);

    /* after a short flash, advance or end round */
    setTimeout(() => advanceQuestion(updatedPlayers), 300);
  }, [
    state.currentPlayer,
    state.players,
    currentRound.currentQuestionIndex,
    dispatch,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers
  ]);

  /* ──────────────────────────────────────────────────────────── */
  const handleWrongAnswer = useCallback((playerId: string) => {
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

    setCurrentRound(prev => ({
      ...prev,
      playerAnswers: prev.playerAnswers.filter(a => a.playerId !== playerId)
    }));
    setShowPendingAnswers(false);

    /* if nobody else queued, advance / end round */
    if (currentRound.playerAnswers.length <= 1) {
      setTimeout(() => advanceQuestion(updatedPlayers), 300);
    }
  }, [
    state.currentPlayer,
    state.players,
    currentRound.playerAnswers.length,
    currentRound.currentQuestionIndex,
    dispatch,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers
  ]);

  /* ──────────────────────────────────────────────────────────── */
  const handleNextQuestion = useCallback(() => {
    if (!state.currentPlayer?.isHost) return;

    /* still questions left handled by advanceQuestion() calls */
    const idx = currentRound.currentQuestionIndex;
    const total = currentRound.questions.length;
    if (idx < total - 1) return;

    /* ---- round end  ---- */
    const narrators = [...state.players].sort(
      (a, b) => (a.narrator_order || 999) - (b.narrator_order || 999)
    );
    const curIx = narrators.findIndex(p => p.id === currentRound.narratorId);
    const nextIx = (curIx + 1) % narrators.length;
    const nextNarratorId = narrators[nextIx].id;

    const isFinalRound = currentRound.roundNumber >= MAX_ROUNDS;
    broadcastRoundEnd(
      currentRound.roundNumber,
      nextNarratorId,
      state.players,
      isFinalRound
    );

    setShowRoundBridge(true);
    if (isFinalRound) setTimeout(() => setGameOver(true), 6500);
  },
  [
    state.currentPlayer,
    state.players,
    currentRound.currentQuestionIndex,
    currentRound.questions.length,
    currentRound.roundNumber,
    currentRound.narratorId,
    setShowRoundBridge,
    setGameOver
  ]);

  /* ------------------------------------------------------------------ */
  return { handleCorrectAnswer, handleWrongAnswer, handleNextQuestion };
};
