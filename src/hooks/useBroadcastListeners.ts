import { useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Round, TriviaQuestion } from '@/types/trivia';
import { useGame } from '@/context/GameContext';
import { mockQuestions, QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';

export const useBroadcastListeners = (
  gameChannel: RealtimeChannel | null
) => {
  const { state, dispatch } = useGame();

  useEffect(() => {
    if (!gameChannel) return;

    // Add event listener for score updates and other game events
    const subscription = gameChannel.on('broadcast', { event: 'SCORE_UPDATE' }, (payload) => {
      console.log('[useBroadcastListeners] Received score update:', payload);
      
      if (payload.payload?.scores) {
        const scores = payload.payload.scores;
        
        // Update scores in the game state
        scores.forEach((scoreUpdate: { id: string; score: number }) => {
          dispatch({
            type: 'UPDATE_SCORE',
            payload: {
              playerId: scoreUpdate.id,
              score: scoreUpdate.score
            }
          });
        });
      }
    });

    // Add event listener for next question updates
    gameChannel.on('broadcast', { event: 'NEXT_QUESTION' }, (payload) => {
      console.log('[useBroadcastListeners] Received next question update:', payload);
      
      if (payload.payload?.scores) {
        const scores = payload.payload.scores;
        
        // Update scores in the game state
        scores.forEach((scoreUpdate: { id: string; score: number }) => {
          dispatch({
            type: 'UPDATE_SCORE',
            payload: {
              playerId: scoreUpdate.id,
              score: scoreUpdate.score
            }
          });
        });
      }
    });

    // Add event listener for round end
    gameChannel.on('broadcast', { event: 'ROUND_END' }, (payload) => {
      console.log('[useBroadcastListeners] Received round end:', payload);
      
      if (payload.payload?.scores) {
        const scores = payload.payload.scores;
        
        // Update scores in the game state
        scores.forEach((scoreUpdate: { id: string; score: number }) => {
          dispatch({
            type: 'UPDATE_SCORE',
            payload: {
              playerId: scoreUpdate.id,
              score: scoreUpdate.score
            }
          });
        });
      }
      
      // Store the next round information in session storage if available
      if (payload.payload?.nextRound) {
        sessionStorage.setItem('nextRound', payload.payload.nextRound.toString());
      }
      
      if (payload.payload?.nextNarratorId) {
        sessionStorage.setItem('nextNarratorId', payload.payload.nextNarratorId);
      }
      
      if (payload.payload?.isGameOver) {
        sessionStorage.setItem('gameOver', payload.payload.isGameOver.toString());
      }
    });

    return () => {
      if (gameChannel) {
        gameChannel.unsubscribe();
      }
    };
  }, [gameChannel, dispatch]);
};
