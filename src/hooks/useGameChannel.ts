
import { useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { setGameChannel, cleanupChannel } from '@/utils/triviaBroadcast';

export const useGameChannel = (gameId: string | null) => {
  const gameChannelRef = useRef<any>(null);

  useEffect(() => {
    if (!gameId || gameChannelRef.current) return;
    const ch = supabase.channel(`game-${gameId}`).subscribe();
    gameChannelRef.current = ch;
    setGameChannel(ch);
    return () => {
      cleanupChannel();
      gameChannelRef.current = null;
    };
  }, [gameId]);

  return gameChannelRef;
};
