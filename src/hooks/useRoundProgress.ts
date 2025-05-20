import { useState, useCallback } from 'react'
import type { Round } from '@/types/trivia'
import {
  MAX_ROUNDS,
  QUESTIONS_PER_ROUND,
  QUESTION_TIMER
} from '@/utils/triviaConstants'
import { broadcastNextQuestion, broadcastRoundEnd } from '@/utils/triviaBroadcast'
import type { Player } from '@/context/GameContext'

/**
 * Manages advancing through questions and rounds.
 */
export const useRoundProgress = (
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  players: Player[],
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPending: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [showRoundBridge, setShowRoundBridge] = useState(false)
  const [nextNarrator, setNextNarrator] = useState<string>('')
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1)
  const [gameOver, setGameOver] = useState(false)

  const handleNextQuestion = useCallback(() => {
    const idx  = currentRound.currentQuestionIndex
    const last = idx >= QUESTIONS_PER_ROUND - 1

    if (last) {
      // end-of-round
      if (currentRound.roundNumber >= MAX_ROUNDS) {
        broadcastRoundEnd(currentRound.roundNumber, '', players, true)
        setShowRoundBridge(true)
        setTimeout(() => setGameOver(true), 6500)
      } else {
        const order = [...players].sort(
          (a, b) => (a.narrator_order ?? 999) - (b.narrator_order ?? 999)
        )
        const curIx  = order.findIndex(p => p.id === currentRound.narratorId)
        const nextId = order[(curIx + 1) % order.length].id

        setNextNarrator(nextId)
        setNextRoundNumber(currentRound.roundNumber + 1)
        broadcastRoundEnd(currentRound.roundNumber, nextId, players)
        setShowRoundBridge(true)
      }
    } else {
      // same round → next question
      const next = idx + 1
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: next,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }))
      setAnsweredPlayers(new Set())
      setShowPending(false)
      broadcastNextQuestion(next, players)
    }
  }, [
    currentRound,
    players,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPending
  ])

  const startNextRound = () => {
    // called by RoundBridgePage after bridge countdown
    setCurrentRound(prev => ({
      roundNumber: nextRoundNumber,
      narratorId:  nextNarrator,
      questions:   prev.questions.map(q => ({
        ...q,
        id: `r${nextRoundNumber}-${q.id}`
      })),
      currentQuestionIndex: 0,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    }))
    setAnsweredPlayers(new Set())
    setShowPending(false)
    setShowRoundBridge(false)
  }

  return {
    showRoundBridge,
    setShowRoundBridge,
    nextNarrator,
    setNextNarrator,
    nextRoundNumber,
    setNextRoundNumber,
    gameOver,
    setGameOver,
    handleNextQuestion,
    startNextRound
  }
}
