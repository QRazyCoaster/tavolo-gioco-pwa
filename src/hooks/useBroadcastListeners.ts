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
  currentRound: Round,
  setEliminatedPlayers: React.Dispatch<React.SetStateAction<Set<string>>>
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
        const { questionIndex, scores } = payload

        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) =>
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
          )
        }

        setCurrentRound(prev => ({
          ...prev,
          currentQuestionIndex: questionIndex,
          playerAnswers: [],
          timeLeft: QUESTION_TIMER
        }))
        setAnsweredPlayers(new Set())
        setShowPendingAnswers(false)
        setEliminatedPlayers(new Set())
      }
    )

    /* ───────────────────────── SCORE_UPDATE ───────────────────────── */
    gameChannel.on(
      'broadcast',
      { event: 'SCORE_UPDATE' },
      ({ payload }: { payload: any }) => {
        const { scores } = payload
        if (!Array.isArray(scores)) return
        scores.forEach((s: { id: string; score: number }) =>
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
        )
      }
    )

    /* ───────────────────────── BUZZ ───────────────────────── */
    gameChannel.on(
      'broadcast',
      { event: 'BUZZ' },
      ({ payload }: { payload: any }) => {
        const { playerId, playerName } = payload
        setCurrentRound(prev => {
          if (prev.playerAnswers.some(a => a.playerId === playerId)) return prev
          const newAnswer: PlayerAnswer = { playerId, playerName, timestamp: Date.now() }
          return { ...prev, playerAnswers: [...prev.playerAnswers, newAnswer] }
        })
        setShowPendingAnswers(true)
      }
    )

    /* ───────────────────────── PLAYER_ELIMINATED ───────────────────────── */
    gameChannel.on(
      'broadcast',
      { event: 'PLAYER_ELIMINATED' },
      ({ payload }: { payload: any }) => {
        const { playerId } = payload
        setEliminatedPlayers(prev => new Set([...prev, playerId]))
      }
    )

    /* ───────────────────────── ROUND_END ───────────────────────── */
    gameChannel.on(
      'broadcast',
      { event: 'ROUND_END' },
      ({ payload }: { payload: any }) => {
        const { nextRound, nextNarratorId, scores, isGameOver = false } = payload

        // update scores
        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) =>
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
          )
        }

        // 1) Mark narrator completed on every client
        dispatch({
          type: 'MARK_NARRATOR_COMPLETED',
          payload: currentRound.narratorId
        })

        // reset answered/eliminated state
        setAnsweredPlayers(new Set())
        setShowPendingAnswers(false)
        setEliminatedPlayers(new Set())

        // Determine if game should end after the number of rounds equals number of players
        const numPlayers = state.players.length
        if (isGameOver || nextRound > numPlayers) {
          setGameOver(true)
        } else {
          if (nextNarratorId) setNextNarrator(nextNarratorId)
          setNextRoundNumber(nextRound)
          setShowRoundBridge(true)
        }
        }
      }
    )

    /* ───────────────────────── housekeeping ───────────────────────── */
    // Note: These events may need different signatures in newer Supabase versions
    // gameChannel.on('disconnect', () => console.log('[useBroadcastListeners] Game channel disconnected'))
    // gameChannel.on('error', (error: any) => console.error('[useBroadcastListeners] Game channel error:', error))
    // gameChannel.on('reconnect', () => console.log('[useBroadcastListeners] Game channel reconnected'))
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
    currentPlayerId,
    setEliminatedPlayers
  ])
}
