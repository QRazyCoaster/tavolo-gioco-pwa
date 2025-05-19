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
    const ch = gameChannel;
    if (!ch) return;

    // ───── NEXT_QUESTION ─────
    ch.on('broadcast', { event: 'NEXT_QUESTION' }, ({ payload }) => {
      console.log('[useBroadcastListeners] NEXT_QUESTION', payload);
      const { questionIndex, scores } = payload as any;

      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: questionIndex,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);

      if (scores && Array.isArray(scores)) {
        scores.forEach((s: any) => {
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
        });
      }
    });

    // ───── SCORE_UPDATE ─────
    ch.on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
      console.log('[useBroadcastListeners] SCORE_UPDATE', payload);
      if (payload?.scores && Array.isArray(payload.scores)) {
        payload.scores.forEach((s: any) => {
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
        });
      }
    });

    // ───── BUZZ ─────
    ch.on('broadcast', { event: 'BUZZ' }, ({ payload }) => {
      console.log('[useBroadcastListeners] BUZZ', payload);
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
      console.log('[useBroadcastListeners] ROUND_END', payload);
      const { nextRound, nextNarratorId, scores, isGameOver, nextNarratorName } = payload as any;

      if (nextNarratorId) {
        console.log('[useBroadcastListeners] setNextNarrator:', nextNarratorId, nextNarratorName);
        setNextNarrator(nextNarratorId);
      }

      if (scores && Array.isArray(scores)) {
        scores.forEach((s: any) => {
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
        });
      }

      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      setShowRoundBridge(true);

      if (isGameOver) {
        console.log('[useBroadcastListeners] Game over');
        setTimeout(() => setGameOver(true), 6500);
      }

      // ← **no** automatic call to setCurrentRound here;
      //    the page's RoundBridgePage → onCountdownComplete triggers startNextRound()
    });

    // subscribe & keep alive
    ch.subscribe();
    // cleanup not needed—listeners live as long as channel
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
    currentRound
  ]);
};
