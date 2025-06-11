// src/hooks/useBroadcastListeners.ts
import { useEffect } from 'react'
import { useGame }            from '@/context/GameContext'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Round, PlayerAnswer } from '@/types/trivia'
import { QUESTION_TIMER }      from '@/utils/triviaConstants'

/**
 * Broadcast listener now:
 * 1) logs all incoming events for debugging
 * 2) listens for both 'ROUND_END' and 'round_end'
 * 3) updates every client with the same payload data
 */
export const useBroadcastListeners = (
  gameChannel: RealtimeChannel | null,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  setNextNarrator: React.Dispatch<React.SetStateAction<string>>,
  setShowRoundBridge: React.Dispatch<React.SetStateAction<boolean>>,
  setNextRoundNumber: React.Dispatch<React.SetStateAction<number>>,
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>,
  dispatch: React.Dispatch<any>,
  gameId: string | null,
  currentRound: Round,
  setEliminatedPlayers: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  const { state } = useGame()

  useEffect(() => {
    if (!gameChannel) return

    // 1) Raw logger for all broadcasts
    gameChannel.on('broadcast', (msg: any) => {
      console.log('[useBroadcastListeners] raw broadcast', msg)
    })

    // Handler for ROUND_END (both cases)
    const handleRoundEnd = ({ payload }: { payload: any }) => {
      console.log('[useBroadcastListeners] ROUND_END payload:', payload)
      const {
        scores,
        nextRound,
        nextNarratorId,
        isGameOver = false
      } = payload

      // Update scores
      if (Array.isArray(scores)) {
        scores.forEach((s: { id: string; score: number }) =>
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
        )
      }

      // Mark completed on all clients
      dispatch({
        type: 'MARK_NARRATOR_COMPLETED',
        payload: currentRound.narratorId
      })

      // Reset per-round state
      setAnsweredPlayers(new Set())
      setShowPendingAnswers(false)
      setEliminatedPlayers(new Set())

      // Game over or next narrator
      if (isGameOver || !nextNarratorId) {
        setGameOver(true)
      } else {
        setNextNarrator(nextNarratorId)
        setNextRoundNumber(nextRound)
        setShowRoundBridge(true)
      }
    }

    // 2) Listen for both uppercase and lowercase
    gameChannel.on(
      'broadcast',
      { event: 'ROUND_END' },
      handleRoundEnd
    )
    gameChannel.on(
      'broadcast',
      { event: 'round_end' },
      handleRoundEnd
    )

    // ... include other original listeners here unchanged ...

    return () => {
      gameChannel.off('broadcast')
    }
  }, [
    gameChannel,
    dispatch,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setNextNarrator,
    setShowRoundBridge,
    setNextRoundNumber,
    setGameOver,
    gameId,
    currentRound,
    state.originalNarratorQueue,
    state.completedNarrators
  ])
}
