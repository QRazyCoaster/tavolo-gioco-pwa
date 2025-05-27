// src/hooks/useBroadcastListeners.ts
import { useEffect, useRef } from 'react'
import { useGame }            from '@/context/GameContext'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Round, PlayerAnswer } from '@/types/trivia'
import { QUESTION_TIMER }      from '@/utils/triviaConstants'

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
  currentRound: Round
) => {
  const { state } = useGame()
  const currentPlayerId = state.currentPlayer?.id
  const hasSetup = useRef(false)

  useEffect(() => {
    if (!gameChannel || hasSetup.current) return
    hasSetup.current = true

    /* ───────────────────────── NEXT_QUESTION ───────────────────────── */
    gameChannel.on(
      'broadcast',
      { event: 'NEXT_QUESTION' },
      ({ payload }: { payload: any }) => {
        /* … */
      }
    )

    /* ───────────────────────── SCORE_UPDATE ───────────────────────── */
    gameChannel.on(
      'broadcast',
      { event: 'SCORE_UPDATE' },
      ({ payload }: { payload: any }) => {
        /* … */
      }
    )

    /* ───────────────────────── BUZZ ───────────────────────── */
    gameChannel.on(
      'broadcast',
      { event: 'BUZZ' },
      ({ payload }: { payload: any }) => {
        /* … */
      }
    )

    /* ───────────────────────── ROUND_END ───────────────────────── */
    gameChannel.on(
      'broadcast',
      { event: 'ROUND_END' },
      ({ payload }: { payload: any }) => {
        /* … */
      }
    )

    /* ───────────────────────── housekeeping ───────────────────────── */
    gameChannel.on(
      'disconnect',
      {},
      () => console.log('[useBroadcastListeners] Game channel disconnected')
    )
    gameChannel.on(
      'error',
      {},
      (error: any) => console.error('[useBroadcastListeners] Game channel error:', error)
    )
    gameChannel.on(
      'reconnect',
      {},
      () => console.log('[useBroadcastListeners] Game channel reconnected')
    )
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
    currentRound.roundNumber,
    currentPlayerId
  ])
}
