import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Round } from '@/types/trivia';
import { QUESTION_TIMER } from '@/utils/triviaConstants';

export const useBroadcastListeners = (
  gameChannel: RealtimeChannel | null,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  setNextNarrator: (id: string) => void,
  setShowRoundBridge: (show: boolean) => void,
  setGameOver: (over: boolean) => void,
  dispatch: any,
  gameId: string | null,
  currentRound: Round
) => {
  useEffect(() => {
    if (!gameChannel) return;
    const ch = gameChannel;

    // ───── NEXT_QUESTION ─────
    ch.on('broadcast', { event: 'NEXT_QUESTION' }, ({ payload }) => {
      const { questionIndex, scores } = payload as any;

      // 1) update scores
      if (Array.isArray(scores)) {
        scores.forEach((s: any) => {
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
        });
      }

      // 2) move to next question
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: questionIndex,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
    });

    // ───── SCORE_UPDATE ─────
    ch.on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
      const { scores } = payload as any;
      if (Array.isArray(scores)) {
        scores.forEach((s: any) => {
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
        });
      }
    });

    // ───── BUZZ ─────
    ch.on('broadcast', { event: 'BUZZ' }, ({ payload }) => {
      const { playerId, playerName, questionIndex } = payload as any;

      setCurrentRound(prev => {
        if (questionIndex !== prev.currentQuestionIndex) return prev;
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

    // ───── ROUND_END ─────
    ch.on('broadcast', { event: 'ROUND_END' }, ({ payload }) => {
      const { nextRound, nextNarratorId, scores, isGameOver } = payload as any;

      // 1) update scores
      if (Array.isArray(scores)) {
        scores.forEach((s: any) => {
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
        });
      }

      // 2) set up transition
      if (nextNarratorId) {
        setNextNarrator(nextNarratorId);
      }
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      setShowRoundBridge(true);

      // 3) handle final‐game
      if (isGameOver) {
        setTimeout(() => setGameOver(true), 6500);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameChannel,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setNextNarrator,
    setShowRoundBridge,
    setGameOver,
    dispatch,
    gameId,
    // we omitted currentRound entirely to avoid accidental re-setups
  ]);
};
