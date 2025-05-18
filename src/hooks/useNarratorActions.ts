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
import { CORRECT_ANSWER_POINTS, WRONG_ANSWER_POINTS, MIN_SCORE_LIMIT, MAX_ROUNDS } from '@/utils/triviaConstants';

export const useNarratorActions = (
  state: GameState,
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  gameChannel: RealtimeChannel | null,
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  setShowRoundBridge: React.Dispatch<React.SetStateAction<boolean>>,
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>,
  dispatch: any,
  isNarrator: boolean               // ← NEW flag (true only for the active narrator)
) => {
  /* ─────────────────────────────────────────────────────────── */
  /* award points                                               */
  /* ─────────────────────────────────────────────────────────── */
  const handleCorrectAnswer = useCallback(
    (playerId: string) => {
      if (!isNarrator) return;                       // only the active narrator may act

      const player = state.players.find(p => p.id === playerId);
      if (!player) return;

      playAudio('success');

      const newScore = (player.score || 0) + CORRECT_ANSWER_POINTS;
      dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });

      /* broadcast fresh score-table to every tab */
      broadcastScoreUpdate(
        state.players.map(p =>
          p.id === playerId ? { ...p, score: newScore } : p
        )
      );

      /* remove the player from the queue */
      setCurrentRound(prev => ({
        ...prev,
        playerAnswers: prev.playerAnswers.filter(a => a.playerId !== playerId)
      }));
      setShowPendingAnswers(false);

      /* small delay so everyone sees the score flash, then next Q */
      setTimeout(() => handleNextQuestion(), 800);
    },
    [isNarrator, state.players, setCurrentRound, setShowPendingAnswers, dispatch]
  );

  /* ─────────────────────────────────────────────────────────── */
  /* deduct points                                              */
  /* ─────────────────────────────────────────────────────────── */
  const handleWrongAnswer = useCallback(
    (playerId: string) => {
      if (!isNarrator) return;

      const player = state.players.find(p => p.id === playerId);
      if (!player) return;

      playAudio('error');

      const newScore = Math.max(
        MIN_SCORE_LIMIT,
        (player.score || 0) + WRONG_ANSWER_POINTS
      );
      dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });

      broadcastScoreUpdate(
        state.players.map(p =>
          p.id === playerId ? { ...p, score: newScore } : p
        )
      );

      /* remove player from queue */
      setCurrentRound(prev => {
        const remaining = prev.playerAnswers.filter(a => a.playerId !== playerId);
        return { ...prev, playerAnswers: remaining };
      });

      /* if nobody left → auto-advance */
      setTimeout(() => {
        if (
          currentRound.playerAnswers.filter(a => a.playerId !== playerId).length ===
          0
        ) {
          handleNextQuestion();
        }
      }, 500);
    },
    [isNarrator, state.players, currentRound.playerAnswers, setCurrentRound, dispatch]
  );

  /* ─────────────────────────────────────────────────────────── */
  /* next question OR end-of-round                               */
  /* ─────────────────────────────────────────────────────────── */
  const handleNextQuestion = useCallback(() => {
    if (!isNarrator) return;

    const { currentQuestionIndex, roundNumber } = currentRound;
    const isLastQuestion = currentQuestionIndex >= currentRound.questions.length - 1;

    /* ------- next question inside the round ------- */
    if (!isLastQuestion) {
      const nextIdx = currentQuestionIndex + 1;

      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: nextIdx,
        playerAnswers: [],
        timeLeft: prev.timeLeft        // timer resets elsewhere
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);

      broadcastNextQuestion(nextIdx, state.players);
      return;
    }

    /* ------- end-of-round logic ------- */
    const sorted = [...state.players].sort(
      (a, b) => (a.narrator_order ?? 999) - (b.narrator_order ?? 999)
    );
    const curIdx  = sorted.findIndex(p => p.id === currentRound.narratorId);
    const nextIdx = (curIdx + 1) % sorted.length;
    const nextNarratorId = sorted[nextIdx].id;

    const gameIsOver = roundNumber >= MAX_ROUNDS;

    broadcastRoundEnd(roundNumber, nextNarratorId, state.players, gameIsOver);
    setShowRoundBridge(true);

    if (gameIsOver) {
      setTimeout(() => setGameOver(true), 6500);
    }
  }, [
    isNarrator,
    currentRound,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setShowRoundBridge,
    setGameOver,
    state.players
  ]);

  return { handleCorrectAnswer, handleWrongAnswer, handleNextQuestion };
};
