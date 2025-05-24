
import { useEffect, useRef } from 'react';
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
  const hasSetup = useRef(false);

  useEffect(() => {
    if (!gameChannel || hasSetup.current) return;
    hasSetup.current = true;

    console.log('[useBroadcastListeners] Subscribing to game channel', gameId);

    // ─── NEXT QUESTION ───────────────────────────────────────
    gameChannel.on(
      'broadcast',
      { event: 'NEXT_QUESTION' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] NEXT_QUESTION', payload);
        const { questionIndex, scores } = payload;

        // Update scores
        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) => {
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
          });
        }

        // Advance question
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

    // ─── SCORE UPDATE ────────────────────────────────────────
    gameChannel.on(
      'broadcast',
      { event: 'SCORE_UPDATE' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] SCORE_UPDATE', payload);
        const { scores } = payload;
        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) => {
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
          });
        }
      }
    );

    // ─── BUZZ ─────────────────────────────────────────────────
    gameChannel.on(
      'broadcast',
      { event: 'BUZZ' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] BUZZ', payload);
        const { playerId, playerName } = payload;

        setCurrentRound(prev => {
          if (prev.playerAnswers.some(a => a.playerId === playerId)) return prev;
          const newAnswer: PlayerAnswer = { playerId, playerName, timestamp: Date.now() };
          return { ...prev, playerAnswers: [...prev.playerAnswers, newAnswer] };
        });

        setShowPendingAnswers(true);
      }
    );

    // ─── ROUND END ────────────────────────────────────────────
    gameChannel.on(
      'broadcast',
      { event: 'ROUND_END' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] ROUND_END', payload);
        const {
          nextRound,
          nextNarratorId,
          scores,
          isGameOver = false
        } = payload;

        // Update final scores
        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) => {
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
          });
        }

        // Clear buzzers
        setAnsweredPlayers(new Set())
