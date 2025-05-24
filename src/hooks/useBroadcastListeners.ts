import { useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Round, PlayerAnswer } from '@/types/trivia'
import { QUESTION_TIMER } from '@/utils/triviaConstants'

export const useBroadcastListeners = (
  gameChannel: RealtimeChannel | null,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  setNextNarrator: (id: string) => void,
  setShowRoundBridge: (show: boolean) => void,
  setNextRoundNumber: (roundNum: number) => void,
  setGameOver: (over: boolean) => void,
  dispatch: React.Dispatch<any>,
  gameId: string | null,
  currentRound: Round
) => {
  const hasSetup = useRef(false)

  useEffect(() => {
    if (!gameChannel || hasSetup.current) return
    hasSetup.current = true

    // ─── ROUND_END ───────────────────────────────────────────
    gameChannel.on(
      'broadcast',
      { event: 'ROUND_END' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] Received ROUND_END', payload)
        const {
          nextRound,
          nextNarratorId,
          scores,
          isGameOver = false
        } = payload

        // update all scores
        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) =>
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
          )
        }

        // clear answers
        setAnsweredPlayers(new Set())
        setShowPendingAnswers(false)

        if (isGameOver) {
          // FINAL: do NOT show bridge, go straight to GameOver
          console.log('[useBroadcastListeners] FINAL round → Game Over')
          setTimeout(() => setGameOver(true), 6500)
        } else {
          // NORMAL: prep the bridge
          if (nextNarratorId) setNextNarrator(nextNarratorId)
          setNextRoundNumber(nextRound)
          setShowRoundBridge(true)
        }
      }
    )

    // ─── OTHER EVENTS (NEXT_QUESTION, SCORE_UPDATE, BUZZ) ────
    // ... keep your existing NEXT_QUESTION, SCORE_UPDATE, BUZZ handlers untouched
    // and your disconnect / error / reconnect handlers ...

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
    currentRound
  ])
}
