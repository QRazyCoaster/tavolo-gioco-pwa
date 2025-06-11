// src/hooks/useBroadcastListeners.ts
import { useEffect } from 'react'
import { useGame } from '@/context/GameContext'

interface RoundEndPayload {
  prevNarratorId: string;
  nextNarratorId: string | null;
  roundNumber: number;
  isGameOver: boolean;
}

export function useBroadcastListeners(
  channel: any,
  setCurrentRound: React.Dispatch<any>,
  setAnsweredPlayers: React.Dispatch<Set<string>>,
  setShowPending: React.Dispatch<boolean>,
  setNextNarrator: React.Dispatch<string>,
  setShowRoundBridge: React.Dispatch<boolean>,
  setNextRoundNumber: React.Dispatch<number>,
  setGameOver: React.Dispatch<boolean>,
  dispatch: React.Dispatch<any>
) {
  useEffect(() => {
    if (!channel) return

    // Listen for round_end broadcasts
    channel.on('round_end', (payload: RoundEndPayload) => {
      // 1) Mark the previous narrator completed on every client
      dispatch({
        type: 'MARK_NARRATOR_COMPLETED',
        payload: payload.prevNarratorId
      })

      // 2) Drive UI for next round or game over
      if (payload.isGameOver) {
        setGameOver(true)
      } else {
        setNextNarrator(payload.nextNarratorId!)  // nextNarratorId guaranteed non-null here
        setNextRoundNumber(payload.roundNumber + 1)
        setShowRoundBridge(true)
      }
    })

    return () => {
      channel.off('round_end')
    }
  }, [channel, dispatch, setGameOver, setNextNarrator, setNextRoundNumber, setShowRoundBridge])
}



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
      console.log('[useRoundProgress] Ending round', currentRound.roundNumber)

      // Removed local-only MARK_NARRATOR_COMPLETED — now handled in broadcast listener

      const updated = new Set([
        ...state.completedNarrators,
        currentRound.narratorId
      ])
      const nextId = state.originalNarratorQueue.find(id => !updated.has(id))

      if (!nextId) {
        broadcastRoundEnd(currentRound.roundNumber, '', players, true)
        setGameOver(true)
      } else {
        const nr = currentRound.roundNumber + 1
        setNextNarrator(nextId)
        setNextRoundNumber(nr)
        broadcastRoundEnd(currentRound.roundNumber, nextId, players)
        setShowRoundBridge(true)
      }
    } else {
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

  // Unchanged disconnect handler…
  const handleNarratorDisconnection = useCallback((nextNarratorId: string | null) => {
    // dispatch handled by broadcast listener
    if (!nextNarratorId) {
      broadcastRoundEnd(currentRound.roundNumber, '', players, true)
      setGameOver(true)
      return
    }
    setNextNarrator(nextNarratorId)
    setNextRoundNumber(currentRound.roundNumber + 1)
    broadcastRoundEnd(currentRound.roundNumber, nextNarratorId, players)
    setShowRoundBridge(true)
  }, [
    currentRound.roundNumber,
    currentRound.narratorId,
    players
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
    startNextRound
  }
}
