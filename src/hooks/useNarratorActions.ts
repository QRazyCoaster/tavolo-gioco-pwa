
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
  isNarrator: boolean
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

      // Update local state first
      const newScore = (player.score || 0) + CORRECT_ANSWER_POINTS;
      dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });

      // Create an updated player list with the new score
      const updatedPlayers = state.players.map(p =>
        p.id === playerId ? { ...p, score: newScore } : p
      );

      /* broadcast fresh score-table to every tab - this is now done BEFORE any other actions */
      broadcastScoreUpdate(updatedPlayers);

      /* remove the player from the queue */
      setCurrentRound(prev => ({
        ...prev,
        playerAnswers: prev.playerAnswers.filter(a => a.playerId !== playerId)
      }));
      setShowPendingAnswers(false);

      /* small delay so everyone sees the score flash, then next Q */
      setTimeout(() => handleNextQuestion(), 1500); // Increased delay to ensure score update is processed
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

      // Update local state first
      const newScore = Math.max(
        MIN_SCORE_LIMIT,
        (player.score || 0) + WRONG_ANSWER_POINTS
      );
      dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });

      // Create an updated player list with the new score
      const updatedPlayers = state.players.map(p =>
        p.id === playerId ? { ...p, score: newScore } : p
      );

      // Broadcast score update immediately
      broadcastScoreUpdate(updatedPlayers);

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
      }, 1000); // Slightly increased delay
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

      // Ensure scores are up to date before broadcasting next question
      const currentScores = state.players.map(p => ({
        id: p.id,
        score: Math.max(MIN_SCORE_LIMIT, p.score || 0)
      }));

      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: nextIdx,
        playerAnswers: [],
        timeLeft: prev.timeLeft        // timer resets elsewhere
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);

      // Send next question with current scores to ensure they're in sync
      broadcastNextQuestion(nextIdx, state.players, currentScores);
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

    // Ensure latest scores are sent in the round end broadcast
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
