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

  // Helper function to get next narrator from original queue
  const getNextNarratorFromOriginalQueue = useCallback(() => {
    console.log('[useNarratorDisconnectionHandler] Getting next narrator from original queue')
    console.log('[useNarratorDisconnectionHandler] Original queue:', state.originalNarratorQueue)
    console.log('[useNarratorDisconnectionHandler] Completed narrators:', Array.from(state.completedNarrators))
    
    const activePlayers = getActivePlayers()
    const activePlayerIds = new Set(activePlayers.map(p => p.id))
    console.log('[useNarratorDisconnectionHandler] Active players:', Array.from(activePlayerIds))
    
    // Find next narrator from original queue who:
    // 1. Hasn't been narrator yet
    // 2. Is currently active
    for (const playerId of state.originalNarratorQueue) {
      if (!state.completedNarrators.has(playerId) && activePlayerIds.has(playerId)) {
        console.log('[useNarratorDisconnectionHandler] Found next narrator:', playerId)
        return playerId
      }
    }
    
    console.log('[useNarratorDisconnectionHandler] No valid next narrator found')
    return null
  }, [state.originalNarratorQueue, state.completedNarrators, getActivePlayers]);

  useEffect(() => {
    const currentNarratorId = currentRound.narratorId;
    if (!currentNarratorId) return;

    // Wait for presence tracking to establish - don't check until we have active players
    const allActivePlayers = getActivePlayers();
    if (allActivePlayers.length === 0) {
      console.log('[useNarratorDisconnectionHandler] Presence tracking not established yet, skipping check');
      return;
    }

    const isNarratorActive = isPlayerActive(currentNarratorId);
    const wasNarratorActive = lastNarratorActiveRef.current;
    
    // Only check for disconnections if the narrator was previously active
    // This prevents triggering on initial load when presence isn't established yet
    if (wasNarratorActive && !isNarratorActive) {
      console.log('[useNarratorDisconnectionHandler] Current narrator disconnected:', currentNarratorId);
      
      // Find next narrator using original queue logic
      const nextNarratorId = getNextNarratorFromOriginalQueue();
      
      if (!nextNarratorId) {
        console.log('[useNarratorDisconnectionHandler] No more valid narrators available, ending game');
        onNarratorDisconnected(null); // Signal game over
        return;
      }
      
      console.log('[useNarratorDisconnectionHandler] Transferring to next narrator:', nextNarratorId);
      onNarratorDisconnected(nextNarratorId);
    }
    
    lastNarratorActiveRef.current = isNarratorActive;
  }, [currentRound.narratorId, currentRound.roundNumber, isPlayerActive, getActivePlayers, onNarratorDisconnected, getNextNarratorFromOriginalQueue]);
};