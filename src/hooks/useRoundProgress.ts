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
  const { state, dispatch } = useGame()
  const [showRoundBridge, setShowRoundBridge] = useState(false)
  const [nextNarrator, setNextNarrator] = useState<string>('')
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1)
  const [gameOver, setGameOver] = useState(false)

  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex
    const last = idx >= currentRound.questions.length - 1

    if (last) {
      console.log(
        '[useRoundProgress] Ending round', 
        currentRound.roundNumber, 
        'completed so far:', 
        [...state.completedNarrators]
      )

      // mark current narrator done
      dispatch({
        type: 'MARK_NARRATOR_COMPLETED',
        payload: currentRound.narratorId
      })

      // local copy of updated set
      const updated = new Set([
        ...state.completedNarrators,
        currentRound.narratorId
      ])
      console.log('[useRoundProgress] After mark, completed:', [...updated])

      // pick next
      const nextId = state.originalNarratorQueue.find(id => !updated.has(id))
      console.log('[useRoundProgress] Next narrator:', nextId)

      if (!nextId) {
        broadcastRoundEnd(
          currentRound.roundNumber,
          '',
          players,
          true  // gameOver
        )
        setGameOver(true)
      } else {
        const nr = currentRound.roundNumber + 1
        setNextNarrator(nextId)
        setNextRoundNumber(nr)
        broadcastRoundEnd(
          currentRound.roundNumber,
          nextId,
          players
        )
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
    setShowPending,
    state.originalNarratorQueue,
    state.completedNarrators,
    dispatch
  ])

  const handleNarratorDisconnection = useCallback((
    nextNarratorId: string | null
  ) => {
    dispatch({
      type: 'MARK_NARRATOR_COMPLETED',
      payload: currentRound.narratorId
    })

    if (!nextNarratorId) {
      broadcastRoundEnd(
        currentRound.roundNumber,
        '',
        players,
        true
      )
      setGameOver(true)
      return
    }

    setNextNarrator(nextNarratorId)
    setNextRoundNumber(currentRound.roundNumber + 1)
    broadcastRoundEnd(
      currentRound.roundNumber,
      nextNarratorId,
      players
    )
    setShowRoundBridge(true)
  }, [
    currentRound.roundNumber,
    currentRound.narratorId,
    players,
    dispatch
  ])

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
    startNextRound    // ← make sure this is here!
  }
}
