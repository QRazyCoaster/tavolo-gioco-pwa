// src/hooks/useRoundProgress.ts
import { useState, useCallback } from 'react'
import { Round } from '@/types/trivia'
import { QUESTION_TIMER } from '@/utils/triviaConstants'
import { broadcastNextQuestion, broadcastRoundEnd } from '@/utils/triviaBroadcast'
import { Player, useGame } from '@/context/GameContext'

export const useRoundProgress = (
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  players: Player[],
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPending: React.Dispatch<React.SetStateAction<boolean>>,
  loadQuestionsForNewRound?: (roundNumber: number) => Promise<any[]>,
  getActivePlayers?: () => Player[]
) => {
  const { state } = useGame()
  const [showRoundBridge, setShowRoundBridge] = useState(false)
  const [nextNarrator, setNextNarrator] = useState<string>('')
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1)
  const [gameOver, setGameOver] = useState(false)

  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex
    const last = idx >= currentRound.questions.length - 1

    if (last) {
      // Compute updated completed set locally
      const updatedCompleted = new Set([...
        state.completedNarrators,
        currentRound.narratorId
      ])
      // Find next narrator
      const nextId = state.originalNarratorQueue.find(
        id => !updatedCompleted.has(id)
      )
      const isGameOverFlag = !nextId

      // Broadcast round end with correct nextNarratorId and gameOver flag
      broadcastRoundEnd(
        currentRound.roundNumber,
        nextId ?? '',
        players,
        isGameOverFlag
      )

      if (isGameOverFlag) {
        setGameOver(true)
      } else {
        setNextNarrator(nextId!)  // safe since !isGameOverFlag
        setNextRoundNumber(currentRound.roundNumber + 1)
        setShowRoundBridge(true)
      }
    } else {
      // Next question in current round
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
    setShowPending,
    state.originalNarratorQueue,
    state.completedNarrators
  ])

  const handleNarratorDisconnection = useCallback((nextNarratorId: string | null) => {
    // On disconnect, broadcast round end as if they finished
    broadcastRoundEnd(
      currentRound.roundNumber,
      nextNarratorId ?? '',
      players,
      nextNarratorId == null
    )
  }, [currentRound.roundNumber, players])

  const startNextRound = async () => {
    let newQuestions = currentRound.questions
    if (loadQuestionsForNewRound) {
      try {
        newQuestions = await loadQuestionsForNewRound(nextRoundNumber)
      } catch (err) {
        console.error('[useRoundProgress] Error loading:', err)
      }
    }

    setCurrentRound({
      roundNumber: nextRoundNumber,
      narratorId: nextNarrator,
      questions: newQuestions,
      currentQuestionIndex: 0,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    })
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
    handleNarratorDisconnection,
    startNextRound
  }
}
