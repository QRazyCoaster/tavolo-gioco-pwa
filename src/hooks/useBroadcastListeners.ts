// src/hooks/useBroadcastListeners.ts
import { useEffect } from 'react'
import { useGame } from '@/context/GameContext'

interface RoundEndPayload {
  prevNarratorId: string;
  nextNarratorId: string | null;
  roundNumber: number;
  isGameOver: boolean;
}

export function useBroadcastListeners(
  channel: any,
  setCurrentRound: React.Dispatch<any>,
  setAnsweredPlayers: React.Dispatch<Set<string>>,
  setShowPending: React.Dispatch<boolean>,
  setNextNarrator: React.Dispatch<string>,
  setShowRoundBridge: React.Dispatch<boolean>,
  setNextRoundNumber: React.Dispatch<number>,
  setGameOver: React.Dispatch<boolean>,
  dispatch: React.Dispatch<any>
) {
  useEffect(() => {
    if (!channel) return

    // Listen for round_end broadcasts
    channel.on('round_end', (payload: RoundEndPayload) => {
      // 1) Mark the previous narrator completed on every client
      dispatch({
        type: 'MARK_NARRATOR_COMPLETED',
        payload: payload.prevNarratorId
      })

      // 2) Drive UI for next round or game over
      if (payload.isGameOver) {
        setGameOver(true)
      } else {
        setNextNarrator(payload.nextNarratorId!)  // nextNarratorId guaranteed non-null here
        setNextRoundNumber(payload.roundNumber + 1)
        setShowRoundBridge(true)
      }
    })

    return () => {
      channel.off('round_end')
    }
  }, [channel, dispatch, setGameOver, setNextNarrator, setNextRoundNumber, setShowRoundBridge])
}
