
import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Round, PlayerAnswer } from '@/types/trivia';
import { QUESTION_TIMER } from '@/utils/triviaConstants';

/**
 * Listens for Supabase "broadcast" events on the shared game channel
 * and updates round state, scores, queues, and end-of-round logic.
 */
export const useBroadcastListeners = (
  gameChannel: RealtimeChannel | null,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  setNextNarrator: (id: string) => void,
  setShowRoundBridge: (show: boolean) => void,
  setGameOver: (over: boolean) => void,
  dispatch: React.Dispatch<any>,
  gameId: string | null,
  currentRound: Round
) => {
  const hasSetup = useRef(false);

  useEffect(() => {
    if (!gameChannel || hasSetup.current) return;
    hasSetup.current = true;

    console.log('[useBroadcastListeners] Setting up event handlers for gameId:', gameId);

    // ─── NEXT_QUESTION ─────────────────────────────────────
    gameChannel.on(
      'broadcast',
      { event: 'NEXT_QUESTION' },
      ({ payload }) => {
        console.log('[useBroadcastListeners] Received NEXT_QUESTION event', payload);
        const { questionIndex, scores } = payload as any;

        // Update scores first
        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) =>
            dispatch({
              type: 'UPDATE_SCORE',
              payload: { playerId: s.id, score: s.score }
            })
          );
        }

        // Advance to the next question
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
      ({ payload }) => {
        console.log('[useBroadcastListeners] Received SCORE_UPDATE event', payload);
        const { scores } = payload as any;
        if (!Array.isArray(scores)) return;
        scores.forEach((s: { id: string; score: number }) =>
          dispatch({
            type: 'UPDATE_SCORE',
            payload: { playerId: s.id, score: s.score }
          })
        );
      }
    );

    // ─── BUZZ ────────────────────────────────────────────────
    gameChannel.on(
      'broadcast',
      { event: 'BUZZ' },
      ({ payload }) => {
        console.log('[useBroadcastListeners] Received BUZZ event', payload);
        const { playerId, playerName, questionIndex } = payload as any;

        // Process buzz events regardless of question index - fix for narrator view issue
        setCurrentRound(prev => {
          // Check if player already in the queue to avoid duplicates
          if (prev.playerAnswers.some(a => a.playerId === playerId)) {
            return prev;
          }
          
          // Create new answer object
          const newAnswer: PlayerAnswer = {
            playerId,
            playerName,
            timestamp: Date.now()
          };
          
          // Add to queue
          const updated = {
            ...prev,
            playerAnswers: [...prev.playerAnswers, newAnswer]
          };
          
          console.log('[useBroadcastListeners] Updated player answers:', updated.playerAnswers);
          return updated;
        });
        
        // Make sure the pending answers UI is shown
        setShowPendingAnswers(true);
      }
    );

    // ─── ROUND_END ───────────────────────────────────────────
    gameChannel.on(
      'broadcast',
      { event: 'ROUND_END' },
      ({ payload }) => {
        console.log('[useBroadcastListeners] Received ROUND_END event', payload);
        const {
          nextRound,
          nextNarratorId,
          scores,
          isGameOver = false
        } = payload as any;

        // 1) Update final scores for this round
        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) =>
            dispatch({
              type: 'UPDATE_SCORE',
              payload: { playerId: s.id, score: s.score }
            })
          );
        }

        // 2) Clear any pending buzzes
        setAnsweredPlayers(new Set());
        setShowPendingAnswers(false);

        // 3) Show the bridge and set who's next
        if (nextNarratorId) {
          setNextNarrator(nextNarratorId);
        }
        setShowRoundBridge(true);

        // 4) If this was the final round, fire gameOver
        if (isGameOver) {
          setTimeout(() => setGameOver(true), 6500);
        }
      }
    );

    // Add channel reconnection handling
    gameChannel.on('disconnect', () => {
      console.log('[useBroadcastListeners] Game channel disconnected');
    });

    gameChannel.on('error', (err) => {
      console.error('[useBroadcastListeners] Game channel error:', err);
    });
    
    gameChannel.on('reconnect', () => {
      console.log('[useBroadcastListeners] Game channel reconnected');
    });

    // no cleanup needed: channel lives for app lifetime
  }, [
    gameChannel,
    dispatch,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setNextNarrator,
    setShowRoundBridge,
    setGameOver,
    gameId,
    currentRound
  ]);
};
