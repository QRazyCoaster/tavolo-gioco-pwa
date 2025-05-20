
import { useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Round } from '@/types/trivia';
import { Player } from '@/context/GameContext';
import { getGameChannel } from '@/utils/triviaBroadcast';

/**
 * Hook for narrator to subscribe to player buzzes and answers
 */
export const useNarratorSubscription = (
  isNarrator: boolean,
  gameId: string | null,
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  players: Player[]
) => {
  useEffect(() => {
    if (!isNarrator || !gameId) return;

    console.log('[useNarratorSubscription] Narrator subscription active:', {
      gameId,
      currentQuestionIndex: currentRound.currentQuestionIndex
    });

    // Intentionally left empty as the broadcast listeners now handle all the events
    // This hook is kept for potential future narrator-specific subscriptions

    return () => {
      console.log('[useNarratorSubscription] Cleaning up narrator subscription');
    };
  }, [isNarrator, gameId, currentRound.currentQuestionIndex]);
};
