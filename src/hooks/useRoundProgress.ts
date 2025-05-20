
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
      // Check if the game is over based on if all players have been narrators once
      // Game over when current round number equals total number of players
      if (currentRound.roundNumber >= players.length) {
        // final round → game ends when all players have been narrator once
        broadcastRoundEnd(currentRound.roundNumber, '', players, true)
        setShowRoundBridge(true)
        setTimeout(() => setGameOver(true), 6500)
      } else {
        // prepare next narrator - use join order (array index)
        // The next narrator is the player at the index matching the current round number
        // Since rounds are 1-based and arrays are 0-based, use roundNumber as index
        const nextId = players[currentRound.roundNumber]?.id || players[0].id

        setNextNarrator(nextId)
        // Fix: Update the next round number to be the current round number + 1
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
    // called by RoundBridgePage
    setCurrentRound(prev => ({
      roundNumber: nextRoundNumber,
      narratorId:  nextNarrator,
      questions:   prev.questions.map(q => ({ ...q, id: `r${nextRoundNumber}-${q.id}` })),
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
