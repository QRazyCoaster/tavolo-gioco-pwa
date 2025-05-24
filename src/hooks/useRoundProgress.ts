// src/hooks/useRoundProgress.ts

import { useState, useCallback, useEffect } from 'react'
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
  const [nextNarrator, setNextNarrator] = useState<string>('')
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1)
  const [gameOver, setGameOver] = useState(false)

  // Debug effect for round progression
  useEffect(() => {
    console.log(
      '[useRoundProgress] Current round number:', currentRound.roundNumber,
      'Next round number state:', nextRoundNumber,
      'Total players:', players.length,
      'Game over state:', gameOver
    )
  }, [currentRound.roundNumber, nextRoundNumber, players.length, gameOver])

  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex
    const last = idx >= QUESTIONS_PER_ROUND - 1

    if (last) {
      console.log(
        '[useRoundProgress] End of round.',
        'Current round:', currentRound.roundNumber,
        'Players:', players.length
      )

      if (currentRound.roundNumber >= players.length) {
        // FINAL ROUND: broadcast end & directly trigger game over (no bridge)
        console.log(
          `[useRoundProgress] FINAL round ${currentRound.roundNumber} complete → skipping bridge`
        )
        broadcastRoundEnd(currentRound.roundNumber, '', players, true)
        setTimeout(() => {
          console.log('[useRoundProgress] Setting gameOver to true')
          setGameOver(true)
        }, 6500)
      } else {
        // NEXT ROUND: normal bridge flow
        console.log(
          `[useRoundProgress] showRoundBridge(true) after finishing round ${currentRound.roundNumber} (next round)`
        )
        const nextId = players[currentRound.roundNumber]?.id || players[0].id
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
    console.log(
      '[useRoundProgress] Starting next round:',
      nextRoundNumber,
      'with narrator:',
      nextNarrator
    )
    setCurrentRound(prev => ({
      roundNumber: nextRoundNumber,
      narratorId: nextNarrator,
      questions: prev.questions.map(q => ({
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
