
import { useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { setGameChannel, cleanupChannel } from '@/utils/triviaBroadcast';

export const useGameChannel = (gameId: string | null) => {
  const gameChannelRef = useRef<any>(null);

  useEffect(() => {
    // Clean up any existing channel first
    if (gameChannelRef.current) {
      console.log('[useGameChannel] Removing existing channel before creating a new one');
      supabase.removeChannel(gameChannelRef.current);
      gameChannelRef.current = null;
    }
    
    // Only create a new channel if we have a gameId and no existing channel
    if (!gameId) return;
    
    console.log(`[useGameChannel] Creating new channel for game: ${gameId}`);
    const ch = supabase.channel(`game-${gameId}`).subscribe();
    gameChannelRef.current = ch;
    setGameChannel(ch);
    
    return () => {
      console.log('[useGameChannel] Cleaning up game channel on unmount');
      if (gameChannelRef.current) {
        supabase.removeChannel(gameChannelRef.current);
        gameChannelRef.current = null;
      }
      cleanupChannel();
    };
  }, [gameId]);

  return gameChannelRef;
};
