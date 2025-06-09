import { useEffect, useRef } from 'react';
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
  const { state } = useGame();
  const lastNarratorActiveRef = useRef<boolean>(true);

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
      
      // Get list of active players excluding the disconnected narrator
      const activePlayers = allActivePlayers.filter(p => p.id !== currentNarratorId);
      
      // Check if we have any active players left
      if (activePlayers.length === 0) {
        console.log('[useNarratorDisconnectionHandler] No active players left, ending game');
        onNarratorDisconnected(null); // Signal game over
        return;
      }
      
      // Find next narrator from active players based on round rotation
      // Use round number to determine next narrator position
      const nextNarratorIndex = currentRound.roundNumber % activePlayers.length;
      const nextNarratorId = activePlayers[nextNarratorIndex]?.id;
      
      if (!nextNarratorId) {
        console.log('[useNarratorDisconnectionHandler] Could not find next narrator, ending game');
        onNarratorDisconnected(null); // Signal game over
        return;
      }
      
      // Check if this would be the last round (all players have been narrator)
      const totalPlayers = state.players.length;
      const isLastRound = currentRound.roundNumber >= totalPlayers;
      
      if (isLastRound) {
        console.log('[useNarratorDisconnectionHandler] Last round narrator disconnected, ending game');
        onNarratorDisconnected(null); // Signal game over
      } else {
        console.log('[useNarratorDisconnectionHandler] Transferring to next narrator:', nextNarratorId);
        onNarratorDisconnected(nextNarratorId);
      }
    }
    
    lastNarratorActiveRef.current = isNarratorActive;
  }, [currentRound.narratorId, currentRound.roundNumber, isPlayerActive, getActivePlayers, onNarratorDisconnected, state.players.length]);
};