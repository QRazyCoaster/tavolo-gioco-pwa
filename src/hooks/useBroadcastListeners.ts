// src/hooks/useBroadcastListeners.ts
import { useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';        // ← ADDED
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Round, PlayerAnswer } from '@/types/trivia';
import { QUESTION_TIMER } from '@/utils/triviaConstants';

export const useBroadcastListeners = (
  gameChannel: RealtimeChannel | null,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  setNextNarrator: (id: string) => void,
  setShowRoundBridge: (show: boolean) => void,
  setNextRoundNumber: (roundNum: number) => void,
  setGameOver: (over: boolean) => void,
  dispatch: React.Dispatch<any>,
  gameId: string | null,
  currentRound: Round
) => {
  const { state } = useGame();                         // ← ADDED
  const currentPlayerId = state.currentPlayer?.id;      // ← ADDED
  const hasSetup = useRef(false);

  useEffect(() => {
    if (!gameChannel || hasSetup.current) return;
    hasSetup.current = true;

    console.log('[useBroadcastListeners] Setting up event handlers for gameId:', gameId);

    // ─── NEXT_QUESTION ─────────────────────────────────────
    gameChannel.on(
      'broadcast',
      { event: 'NEXT_QUESTION' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] Received NEXT_QUESTION', payload);
        const { questionIndex, scores } = payload;

        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) =>
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
          );
        }

        setCurrentRound(prev => ({
          ...prev,
          currentQuestionIndex: questionIndex,
          playerAnswers: [],
          timeLeft: QUESTION_TIMER
        }));
        setAnsweredPlayers(new Set());
        setShowPendingAnswers(false);
      }
    );

    // ─── SCORE_UPDATE ───────────────────────────────────────
    gameChannel.on(
      'broadcast',
      { event: 'SCORE_UPDATE' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] Received SCORE_UPDATE', payload);
        const { scores } = payload;
        if (!Array.isArray(scores)) return;
        scores.forEach((s: { id: string; score: number }) =>
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
        );
      }
    );

    // ─── BUZZ ────────────────────────────────────────────────
    gameChannel.on(
      'broadcast',
      { event: 'BUZZ' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] Received BUZZ', payload);
        const { playerId, playerName } = payload;

        setCurrentRound(prev => {
          if (prev.playerAnswers.some(a => a.playerId === playerId)) return prev;

          const newAnswer: PlayerAnswer = {
            playerId,
            playerName,
            timestamp: Date.now()
          };
          return { ...prev, playerAnswers: [...prev.playerAnswers, newAnswer] };
        });

        setShowPendingAnswers(true);
      }
    );

    // ─── ROUND_END ───────────────────────────────────────────
    gameChannel.on(
      'broadcast',
      { event: 'ROUND_END' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] Received ROUND_END', payload);
        const { nextRound, nextNarratorId, scores, isGameOver = false } = payload;

        // LOG when each client sees the ROUND_END
        console.log(
          `[useBroadcastListeners] ROUND_END on ${
            currentPlayerId === nextNarratorId ? 'Narrator' : 'Player'
          } client; payload.nextRound=${nextRound}`
        );

        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) =>
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
          );
        }

        setAnsweredPlayers(new Set());
        setShowPendingAnswers(false);

        if (nextNarratorId) {
          setNextNarrator(nextNarratorId);
        }
        setNextRoundNumber(nextRound);

        setShowRoundBridge(true);

        if (isGameOver) {
          console.log('[useBroadcastListeners] Game over flag received, setting game over state');
          setTimeout(() => setGameOver(true), 6500);
        }
      }
    );

    // ─── OTHER LISTENERS ───────────────────────
    gameChannel.on('disconnect', () => {
      console.log('[useBroadcastListeners] Game channel disconnected');
    });

    gameChannel.on('error', (error: any) => {
      console.error('[useBroadcastListeners] Game channel error:', error);
    });

    gameChannel.on('reconnect', () => {
      console.log('[useBroadcastListeners] Game channel reconnected');
    });

    // no cleanup: channel persists
  }, [
    gameChannel,
    dispatch,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setNextNarrator,
    setShowRoundBridge,
    setNextRoundNumber,
    setGameOver,
    gameId,
    currentRound,
    state   // ← ensure effect re-runs if currentPlayer changes
  ]);
};
