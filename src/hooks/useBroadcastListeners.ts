
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
  mockQuestions: any[],
  QUESTIONS_PER_ROUND: number
) => {
  useEffect(() => {
    const ch = gameChannel;
    if (!ch) return;

    ch.on('broadcast', { event: 'NEXT_QUESTION' }, ({ payload }) => {
      console.log('[useBroadcastListeners] Received NEXT_QUESTION broadcast:', payload);
      const { questionIndex, scores } = payload as any;
      
      // Reset all game state for the new question
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: questionIndex,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      
      // Clear the answered players set
      setAnsweredPlayers(new Set());
      
      // Hide pending answers panel
      setShowPendingAnswers(false);
      
      // Update scores if provided
      if (scores && Array.isArray(scores)) {
        console.log('[useBroadcastListeners] Updating scores from NEXT_QUESTION broadcast:', scores);
        scores.forEach((s: any) => {
          if (s && s.id && typeof s.score === 'number') {
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
          }
        });
      }
    });

    ch.on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
      console.log('[useBroadcastListeners] Received SCORE_UPDATE broadcast:', payload);
      if (payload && payload.scores && Array.isArray(payload.scores)) {
        payload.scores.forEach((s: any) => {
          if (s && s.id && typeof s.score === 'number') {
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
          }
        });
      }
    });

    ch.on('broadcast', { event: 'BUZZ' }, ({ payload }) => {
      const { playerId, playerName, questionIndex } = payload as any;
      
      console.log('[useBroadcastListeners] Received BUZZ broadcast:', { playerId, playerName, questionIndex });
      
      setCurrentRound(prev => {
        // Make sure we're on the same question
        if (questionIndex !== prev.currentQuestionIndex) {
          console.log('[useBroadcastListeners] Ignoring BUZZ for different question index');
          return prev;
        }
        
        // Avoid duplicates
        if (prev.playerAnswers.some(a => a.playerId === playerId)) {
          console.log('[useBroadcastListeners] Player already in answer queue, ignoring');
          return prev;
        }
        
        console.log('[useBroadcastListeners] Adding player to answer queue:', playerId, playerName);
        
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

    ch.on('broadcast', { event: 'ROUND_END' }, ({ payload }) => {
      const { nextRound, nextNarratorId, scores, isGameOver, nextNarratorName } = payload as any;
      
      console.log('[useBroadcastListeners] Received ROUND_END broadcast:', payload);
      
      // Make sure to set the next narrator ID immediately so the round bridge shows it
      if (nextNarratorId) {
        console.log('[useBroadcastListeners] Setting next narrator ID:', nextNarratorId, 'Name:', nextNarratorName || 'Unknown');
        setNextNarrator(nextNarratorId);
      }
      
      // Update scores if provided
      if (scores && Array.isArray(scores)) {
        scores.forEach((s: any) => {
          if (s && s.id && typeof s.score === 'number') {
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
          }
        });
      }

      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      setShowRoundBridge(true);
      
      // Handle game over state
      if (isGameOver) {
        console.log("[useBroadcastListeners] Game over received from broadcast");
        setTimeout(() => {
          setGameOver(true);
        }, 6500); // Wait for round bridge to complete
        return;
      }

      // After delay, set up the new round
      setTimeout(() => {
        if (!isGameOver) {
          console.log('[useBroadcastListeners] Creating new round:', nextRound, 'with narrator:', nextNarratorId);
          
          const newQuestions = mockQuestions
            .slice(0, QUESTIONS_PER_ROUND)
            .map(q => ({ ...q, id: `r${nextRound}-${q.id}` }));
          
          setCurrentRound({
            roundNumber: nextRound,
            narratorId: nextNarratorId,
            questions: newQuestions,
            currentQuestionIndex: 0,
            playerAnswers: [],
            timeLeft: QUESTION_TIMER
          });
        }
      }, 6500); // Wait for round bridge to complete
    });

    return () => { /* listeners live for lifetime of channel */ };
  }, [
    gameChannel,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setNextNarrator,
    setShowRoundBridge,
    setGameOver,
    dispatch,
    mockQuestions,
    QUESTIONS_PER_ROUND
  ]);
};
