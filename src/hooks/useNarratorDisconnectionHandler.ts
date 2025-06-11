import { useEffect, useRef, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { Round } from '@/types/trivia';

interface UseNarratorDisconnectionHandlerProps {
  currentRound: Round;
  isPlayerActive: (playerId: string) => boolean;
  getActivePlayers: () => any[];
  onNarratorDisconnected: (nextNarratorId: string | null) => void;
}

export const useNarratorDisconnectionHandler = ({
  currentRound,
  isPlayerActive,
  getActivePlayers,
  onNarratorDisconnected
}: UseNarratorDisconnectionHandlerProps) => {
  const { state, dispatch } = useGame();
  const lastNarratorActiveRef = useRef<boolean>(true);

  // Helper function to get next narrator (only for disconnection handling)
  const getNextNarrator = useCallback(() => {
    console.log('[useNarratorDisconnectionHandler] Getting next narrator due to disconnection')
    console.log('[useNarratorDisconnectionHandler] Current narrator (disconnected):', currentRound.narratorId)
    console.log('[useNarratorDisconnectionHandler] Completed narrators:', Array.from(state.completedNarrators))
    console.log('[useNarratorDisconnectionHandler] Original queue:', state.originalNarratorQueue)
    
    // Create updated completed narrators set including the disconnected narrator
    const updatedCompletedNarrators = new Set([...state.completedNarrators, currentRound.narratorId]);
    console.log('[useNarratorDisconnectionHandler] Updated completed (with disconnected):', Array.from(updatedCompletedNarrators))
    
    // Find next narrator from original queue who hasn't been narrator yet
    const nextNarratorId = state.originalNarratorQueue.find(narratorId => 
      !updatedCompletedNarrators.has(narratorId)
    );
    
    if (nextNarratorId) {
      console.log('[useNarratorDisconnectionHandler] Found next narrator:', nextNarratorId)
      return nextNarratorId
    }
    
    console.log('[useNarratorDisconnectionHandler] No valid next narrator found - all have completed')
    return null
  }, [state.completedNarrators, state.originalNarratorQueue, currentRound.narratorId]);

  useEffect(() => {
    const currentNarratorId = currentRound.narratorId;
    if (!currentNarratorId) return;

    // Wait for presence tracking to establish - delay activation by 5 seconds
    const activationTimer = setTimeout(() => {
      const allActivePlayers = getActivePlayers();
      if (allActivePlayers.length === 0) {
        console.log('[useNarratorDisconnectionHandler] Presence tracking still not established after delay');
        return;
      }

      const isNarratorActive = isPlayerActive(currentNarratorId);
      const wasNarratorActive = lastNarratorActiveRef.current;
      
      // Only check for disconnections if the narrator was previously active
      // This prevents triggering on initial load when presence isn't established yet
      if (wasNarratorActive && !isNarratorActive) {
        console.log('[useNarratorDisconnectionHandler] Current narrator disconnected:', currentNarratorId);
        
        // Find next narrator
        const nextNarratorId = getNextNarrator();
        
        if (!nextNarratorId) {
          console.log('[useNarratorDisconnectionHandler] No more valid narrators available, ending game');
          onNarratorDisconnected(null); // Signal game over
          return;
        }
        
        console.log('[useNarratorDisconnectionHandler] Transferring to next narrator:', nextNarratorId);
        onNarratorDisconnected(nextNarratorId);
      }
      
      lastNarratorActiveRef.current = isNarratorActive;
    }, 5000); // 5 second delay to allow presence tracking to establish

    return () => clearTimeout(activationTimer);
  }, [currentRound.narratorId, currentRound.roundNumber, isPlayerActive, getActivePlayers, onNarratorDisconnected, getNextNarrator]);
};