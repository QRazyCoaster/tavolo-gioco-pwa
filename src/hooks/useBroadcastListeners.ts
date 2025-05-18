
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

    ch.on('broadcast', { event: 'ROUND_END' }, ({ payload }) => {
      const { nextRound, nextNarratorId, scores, isGameOver } = payload as any;
      
      console.log('[useBroadcastListeners] Received ROUND_END broadcast:', payload);
      
      if (scores && Array.isArray(scores)) {
        scores.forEach((s: any) => {
          if (s && s.id && typeof s.score === 'number') {
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
          }
        });
      }

      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      
      // Store the next narrator ID for the round bridge
      console.log('[useBroadcastListeners] Setting next narrator ID:', nextNarratorId);
      setNextNarrator(nextNarratorId || '');
      
      // Handle game over state
      if (isGameOver) {
        console.log("[useBroadcastListeners] Game over received from broadcast");
        setTimeout(() => {
          setGameOver(true);
        }, 6500); // Wait for round bridge to complete
      } else {
        setShowRoundBridge(true);
      }

      setTimeout(() => {
        if (!isGameOver) {
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
      }, 6500);
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
