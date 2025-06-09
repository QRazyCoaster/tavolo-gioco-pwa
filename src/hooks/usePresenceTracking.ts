import { useEffect, useState, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useGame } from '@/context/GameContext';

export interface PlayerPresence {
  playerId: string;
  playerName: string;
  lastSeen: number;
  isActive: boolean;
}

export const usePresenceTracking = (gameChannel: RealtimeChannel | null) => {
  const { state, dispatch } = useGame();
  const [activePlayers, setActivePlayers] = useState<Set<string>>(new Set());
  const [playerPresence, setPlayerPresence] = useState<Map<string, PlayerPresence>>(new Map());
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize presence for current player
  useEffect(() => {
    if (!gameChannel || !state.currentPlayer?.id) return;

    const currentPlayerId = state.currentPlayer.id;
    const currentPlayerName = state.currentPlayer.name;

    // Track current player's presence
    const presenceData = {
      playerId: currentPlayerId,
      playerName: currentPlayerName,
      lastSeen: Date.now(),
      isActive: true
    };

    // Send presence update
    gameChannel.track(presenceData);

    // Set up heartbeat to maintain presence
    heartbeatRef.current = setInterval(() => {
      gameChannel.track({
        ...presenceData,
        lastSeen: Date.now()
      });
    }, 30000); // Send heartbeat every 30 seconds

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [gameChannel, state.currentPlayer?.id, state.currentPlayer?.name]);

  // Listen for presence changes
  useEffect(() => {
    if (!gameChannel) return;

    const presenceHandler = gameChannel.on('presence', { event: 'sync' }, () => {
      const presenceState = gameChannel.presenceState();
      console.log('[Presence] Presence state updated:', presenceState);

      const newActiveSet = new Set<string>();
      const newPresenceMap = new Map<string, PlayerPresence>();

      // Process presence data
      Object.entries(presenceState).forEach(([key, presences]: [string, any[]]) => {
        const latestPresence = presences[0]; // Get the latest presence data
        if (latestPresence) {
          const playerId = latestPresence.playerId;
          const isActive = Date.now() - latestPresence.lastSeen < 60000; // Active if seen in last 60 seconds

          newActiveSet.add(playerId);
          newPresenceMap.set(playerId, {
            playerId,
            playerName: latestPresence.playerName,
            lastSeen: latestPresence.lastSeen,
            isActive
          });
        }
      });

      setActivePlayers(newActiveSet);
      setPlayerPresence(newPresenceMap);

      // Note: We'll store active players locally for now
      // Could extend GameContext later if needed
    });

    return () => {
      gameChannel.unsubscribe();
    };
  }, [gameChannel, dispatch]);

  // Get list of active players from game state
  const getActivePlayers = () => {
    return state.players.filter(player => activePlayers.has(player.id));
  };

  // Check if a specific player is active
  const isPlayerActive = (playerId: string) => {
    return activePlayers.has(playerId);
  };

  return {
    activePlayers,
    playerPresence,
    getActivePlayers,
    isPlayerActive
  };
};