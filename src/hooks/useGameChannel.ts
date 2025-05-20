
import { useRef, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/supabaseClient';
import { getGameChannel, setGameChannel } from '@/utils/triviaBroadcast';

/**
 * Creates and manages a Supabase Realtime channel for game communications.
 * Returns a ref to the channel to ensure stability across renders.
 */
export const useGameChannel = (gameId: string | null) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!gameId) return;

    // Check if we already have a channel reference
    const existingChannel = getGameChannel();
    if (existingChannel) {
      channelRef.current = existingChannel;
      return;
    }

    // Create a new channel for the game
    console.log('[useGameChannel] Creating new game channel for:', gameId);
    const channel = supabase.channel(`game:${gameId}`, {
      config: {
        broadcast: {
          self: false
        }
      }
    });

    // Subscribe to the channel
    channel.subscribe(status => {
      console.log('[useGameChannel] Channel status:', status);
    });

    // Store the channel in both the ref and singleton
    channelRef.current = channel;
    setGameChannel(channel);

    // Cleanup function
    return () => {
      console.log('[useGameChannel] Cleaning up game channel');
      channel.unsubscribe();
    };
  }, [gameId]); // Only recreate if gameId changes

  return channelRef;
};
