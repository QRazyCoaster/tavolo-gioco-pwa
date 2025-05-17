
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
      const { questionIndex, scores } = payload as any;
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: questionIndex,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      scores?.forEach((s: any) =>
        dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
      );
    });

    ch.on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
      payload.scores.forEach((s: any) =>
        dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
      );
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
      scores?.forEach((s: any) =>
        dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
      );

      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      setNextNarrator(nextNarratorId);
      
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
