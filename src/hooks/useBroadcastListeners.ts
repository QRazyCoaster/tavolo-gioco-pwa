
import { useEffect, useRef } from 'react';
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
  // Track if listeners are already set up
  const listenersSetupRef = useRef(false);
  // Track latest received score update timestamp
  const lastScoreUpdateRef = useRef<number>(0);
  // Track latest received question update timestamp
  const lastQuestionUpdateRef = useRef<number>(0);
  // Track latest received round end timestamp 
  const lastRoundEndUpdateRef = useRef<number>(0);

  useEffect(() => {
    const ch = gameChannel;
    if (!ch) return;

    // If we've already set up listeners on this component instance, don't do it again
    if (listenersSetupRef.current) {
      console.log('[useBroadcastListeners] Listeners already set up, skipping');
      return;
    }

    console.log('[useBroadcastListeners] Setting up broadcast listeners');
    listenersSetupRef.current = true;

    // ───── NEXT_QUESTION ─────
    ch.on('broadcast', { event: 'NEXT_QUESTION' }, ({ payload }) => {
      console.log('[useBroadcastListeners] NEXT_QUESTION', payload);
      const { questionIndex, scores, timestamp = Date.now() } = payload as any;

      // Check if this is a newer update than what we've already processed
      if (timestamp <= lastQuestionUpdateRef.current) {
        console.log('[useBroadcastListeners] Ignoring older NEXT_QUESTION update');
        return;
      }
      
      lastQuestionUpdateRef.current = timestamp;
      
      // Update scores first
      if (scores && Array.isArray(scores)) {
        console.log('[useBroadcastListeners] Updating scores from NEXT_QUESTION event:', scores);
        scores.forEach((s: any) => {
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
        });
      }

      // Then update the question state
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: questionIndex,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      
      // Force UI refresh after updates
      dispatch({ type: 'REFRESH_UI', payload: timestamp });
    });

    // ───── SCORE_UPDATE ─────
    ch.on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
      console.log('[useBroadcastListeners] SCORE_UPDATE', payload);
      
      // Check if this update is newer than the last one we processed
      const timestamp = payload?.timestamp || Date.now();
      if (timestamp <= lastScoreUpdateRef.current) {
        console.log('[useBroadcastListeners] Ignoring older score update');
        return;
      }
      
      lastScoreUpdateRef.current = timestamp;
      
      if (payload?.scores && Array.isArray(payload.scores)) {
        // Process score updates immediately with high priority
        console.log('[useBroadcastListeners] Processing score updates:', payload.scores);
        
        // Create a batch update for smoother UI updates
        const scoreUpdates = payload.scores.map(s => ({ 
          playerId: s.id, 
          score: s.score 
        }));
        
        // Apply all updates in order
        scoreUpdates.forEach(update => {
          dispatch({ type: 'UPDATE_SCORE', payload: update });
        });
        
        // Trigger a UI refresh with the current timestamp
        dispatch({ type: 'REFRESH_UI', payload: timestamp });
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
      const { nextRound, nextNarratorId, scores, isGameOver, nextNarratorName, timestamp = Date.now() } = payload as any;
      
      // Check if this is a newer update than what we've already processed
      if (timestamp <= lastRoundEndUpdateRef.current) {
        console.log('[useBroadcastListeners] Ignoring older ROUND_END update');
        return;
      }
      
      lastRoundEndUpdateRef.current = timestamp;

      // Process scores first to ensure they're updated before UI changes
      if (scores && Array.isArray(scores)) {
        console.log('[useBroadcastListeners] Processing scores from ROUND_END:', scores);
        scores.forEach((s: any) => {
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
        });
      }

      if (nextNarratorId) {
        console.log('[useBroadcastListeners] setNextNarrator:', nextNarratorId, nextNarratorName);
        setNextNarrator(nextNarratorId);
      }

      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      setShowRoundBridge(true);
      
      // Force UI refresh after updates
      dispatch({ type: 'REFRESH_UI', payload: timestamp });

      if (isGameOver) {
        console.log('[useBroadcastListeners] Game over');
        setTimeout(() => setGameOver(true), 6500);
      }
    });
    
    return () => {
      console.log('[useBroadcastListeners] Cleaning up listeners');
      listenersSetupRef.current = false;
      // We don't remove the channel here since that's handled in useGameChannel
    };
  }, [
    gameChannel,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setNextNarrator,
    setShowRoundBridge,
    setGameOver,
    dispatch,
    gameId
  ]);
};
