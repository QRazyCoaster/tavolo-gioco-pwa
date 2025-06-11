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

  const getNextNarrator = useCallback(() => {
    const nextNarratorId = state.originalNarratorQueue.find(narratorId => 
      !state.completedNarrators.has(narratorId) && narratorId !== currentRound.narratorId
    );
    
    return nextNarratorId || null;
  }, [state.completedNarrators, state.originalNarratorQueue, currentRound.narratorId]);

  useEffect(() => {
    const currentNarratorId = currentRound.narratorId;
    if (!currentNarratorId) return;

    // Wait for presence tracking to establish - delay activation by 5 seconds
    const activationTimer = setTimeout(() => {
      const allActivePlayers = getActivePlayers();
      if (allActivePlayers.length === 0) {
        return;
      }

      const isNarratorActive = isPlayerActive(currentNarratorId);
      const wasNarratorActive = lastNarratorActiveRef.current;
      
      if (wasNarratorActive && !isNarratorActive) {
        const nextNarratorId = getNextNarrator();
        
        if (!nextNarratorId) {
          onNarratorDisconnected(null);
          return;
        }
        
        onNarratorDisconnected(nextNarratorId);
      }
      
      lastNarratorActiveRef.current = isNarratorActive;
    }, 5000); // 5 second delay to allow presence tracking to establish

    return () => clearTimeout(activationTimer);
  }, [currentRound.narratorId, currentRound.roundNumber, isPlayerActive, getActivePlayers, onNarratorDisconnected, getNextNarrator]);
};