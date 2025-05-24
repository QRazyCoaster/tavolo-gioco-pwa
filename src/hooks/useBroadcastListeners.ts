// src/hooks/useBroadcastListeners.ts

import { useEffect, useRef } from 'react'
import { useGame } from '@/context/GameContext'
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
  const { state } = useGame()
  const currentPlayerId = state.currentPlayer?.id
  const hasSetup = useRef(false)

  useEffect(() => {
    if (!gameChannel || hasSetup.current) return
    hasSetup.current = true

    /* … other event handlers … */

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

        console.log(
          `[useBroadcastListeners] ROUND_END on ${
            currentPlayerId === nextNarratorId ? 'Narrator' : 'Player'
          } client; payload.nextRound=${nextRound}`
        )

        // update scores
        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) =>
            dispatch({
              type: 'UPDATE_SCORE',
              payload: { playerId: s.id, score: s.score }
            })
          )
        }

        setAnsweredPlayers(new Set())
        setShowPendingAnswers(false)

        if (isGameOver) {
          console.log('[useBroadcastListeners] FINAL round → skipping bridge, setting game over')
          setTimeout(() => setGameOver(true), 6500)
        } else {
          // normal next-round bridge flow
          if (nextNarratorId) {
            setNextNarrator(nextNarratorId)
          }
          setNextRoundNumber(nextRound)
          setShowRoundBridge(true)
        }
      }
    )

    /* … other event handlers … */

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
    state
  ])
}
