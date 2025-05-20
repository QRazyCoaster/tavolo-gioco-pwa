// src/hooks/useGameChannel.ts
import { useEffect, useRef } from 'react'
import { supabase } from '@/supabaseClient'
import { setGameChannel, cleanupChannel } from '@/utils/triviaBroadcast'

/**
 * Returns a ref to the Supabase RealtimeChannel for this game session,
 * and registers it globally so broadcasts go out to everyone.
 */
export const useGameChannel = (gameId: string | null) => {
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!gameId || channelRef.current) return

    // subscribe to a channel unique to this game instance
    const ch = supabase.channel(`game-${gameId}`).subscribe()
    channelRef.current = ch
    setGameChannel(ch)

    return () => {
      cleanupChannel()
      supabase.removeChannel(ch)
      channelRef.current = null
    }
  }, [gameId])

  return channelRef
}
