
import { useState, useCallback } from 'react'
import { Round } from '@/types/trivia'
import { QUESTION_TIMER, QUESTIONS_PER_ROUND } from '@/utils/triviaConstants'
import { broadcastNextQuestion, broadcastRoundEnd } from '@/utils/triviaBroadcast'
import { Player } from '@/context/GameContext'

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
  const [nextNarrator,    setNextNarrator   ] = useState<string>('')
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1)
  const [gameOver,        setGameOver       ] = useState(false)

  const handleNextQuestion = useCallback(() => {
    const idx  = currentRound.currentQuestionIndex
    const last = idx >= QUESTIONS_PER_ROUND - 1

    if (last) {
      // end-of-round
      if (currentRound.roundNumber >= 3) { // Using fixed value 3 instead of MAX_ROUNDS
        // final round → game over
        broadcastRoundEnd(currentRound.roundNumber, '', players)
        setShowRoundBridge(true)
        setTimeout(() => setGameOver(true), 6500)
      } else {
        // prepare next narrator
        const order = [...players].sort(
          (a, b) => ((a.score ?? 0) - (b.score ?? 0)) // Use score instead of narrator_order
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
        timeLeft: QUESTIONS_PER_ROUND // reset timer
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
    // called by RoundBridgePage
    setCurrentRound(prev => ({
      roundNumber: nextRoundNumber,
      narratorId:  nextNarrator,
      questions:   prev.questions.map(q => ({ ...q, id: `r${nextRoundNumber}-${q.id}` })),
      currentQuestionIndex: 0,
      playerAnswers: [],
      timeLeft: QUESTIONS_PER_ROUND
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
