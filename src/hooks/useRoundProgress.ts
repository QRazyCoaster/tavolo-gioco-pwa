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

  // Debug
  useEffect(() => {
    console.log(
      '[useRoundProgress]',
      'round:', currentRound.roundNumber,
      'next #:', nextRoundNumber,
      'players:', players.length,
      'over:', gameOver
    )
  }, [currentRound.roundNumber, nextRoundNumber, players.length, gameOver])

  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex
    const last = idx >= QUESTIONS_PER_ROUND - 1

    if (last) {
      // Did we just finish the final round?
      if (currentRound.roundNumber >= players.length) {
        // 🚩 FINAL ROUND: broadcast end & go straight to gameOver
        console.log('[useRoundProgress] Final round complete → Game Over')
        broadcastRoundEnd(currentRound.roundNumber, '', players, true)
        // no bridge
        setTimeout(() => setGameOver(true), 6500)
      } else {
        // ── otherwise prep next round as before ──
        const nextId = players[currentRound.roundNumber]?.id || players[0].id
        const nextNum = currentRound.roundNumber + 1
        console.log('[useRoundProgress] Next round:', nextNum, 'narrator:', nextId)
        broadcastRoundEnd(currentRound.roundNumber, nextId, players)
        setNextNarrator(nextId)
        setNextRoundNumber(nextNum)
        setShowRoundBridge(true)
      }
    } else {
      // same round → next question
      const nextIdx = idx + 1
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: nextIdx,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }))
      setAnsweredPlayers(new Set())
      setShowPending(false)
      broadcastNextQuestion(nextIdx, players)
    }
  }, [
    currentRound,
    players,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPending
  ])

  const startNextRound = () => {
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
