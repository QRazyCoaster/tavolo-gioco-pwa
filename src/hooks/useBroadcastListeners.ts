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
        const { scores, nextRound, nextNarratorId, isGameOver = false } = payload

        // 1) Update scores
        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) =>
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
          )
        }

        // 2) Mark the just-finished narrator completed on every client
        dispatch({
          type: 'MARK_NARRATOR_COMPLETED',
          payload: currentRound.narratorId
        })

        // 3) Reset per-round state
        setAnsweredPlayers(new Set())
        setShowPendingAnswers(false)
        setEliminatedPlayers(new Set())

        // 4) Decide: end game if flagged OR no next narrator
        if (isGameOver || !nextNarratorId) {
          setGameOver(true)
        } else {
          setNextNarrator(nextNarratorId)
          setNextRoundNumber(nextRound)
          setShowRoundBridge(true)
        }
      }
    )

    /* ───────────────────────── housekeeping ───────────────────────── */
    // gameChannel.on('disconnect', …)
    // gameChannel.on('error', …)
    // gameChannel.on('reconnect', …)
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
