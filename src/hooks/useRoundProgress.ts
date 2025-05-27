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
  setShowPending: React.Dispatch<React.SetStateAction<boolean>>,
  loadQuestionsForNewRound?: (roundNumber: number) => Promise<any[]>
) => {
  const [showRoundBridge, setShowRoundBridge] = useState(false)
  const [nextNarrator, setNextNarrator] = useState<string>('')
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1)
  const [gameOver, setGameOver] = useState(false)

  /* ───── debug ───── */
  useEffect(() => {
    console.log(
      '[useRoundProgress] Current round number:', currentRound.roundNumber,
      'Next round number state:', nextRoundNumber,
      'Total players:', players.length,
      'Game over state:', gameOver
    )
  }, [currentRound.roundNumber, nextRoundNumber, players.length, gameOver])

  /* ──────────────────────────── */
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
        /* FINAL ROUND */
        console.log(
          `[useRoundProgress] FINAL round ${currentRound.roundNumber} complete → skipping bridge`
        )
        broadcastRoundEnd(currentRound.roundNumber, '', players, true)
        setTimeout(() => {
          console.log('[useRoundProgress] Setting gameOver to true')
          setGameOver(true)
        }, 6500)
      } else {
        /* NEXT ROUND */
        console.log(
          `[useRoundProgress] showRoundBridge(true) after finishing round ${currentRound.roundNumber} (next round)`
        )

        /* --- FIX: choose next narrator safely --- */
        const nextIdx = currentRound.roundNumber            // zero-based index
        console.log('[useRoundProgress] players.length=', players.length,
                    'nextIdx=', nextIdx)
        const nextId =
          players[nextIdx]           ? players[nextIdx]!.id   // in-bounds
          : players[0]?.id ?? ''                              // fallback (should never hit)
        /* ---------------------------------------- */

        setNextNarrator(nextId)
        setNextRoundNumber(currentRound.roundNumber + 1)
        broadcastRoundEnd(currentRound.roundNumber, nextId, players)
        setShowRoundBridge(true)
      }
    } else {
      /* same round → next question */
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

  /* ──────────────────────────── */
  const startNextRound = async () => {
    console.log(
      '[useRoundProgress] Starting next round:',
      nextRoundNumber,
      'with narrator:',
      nextNarrator
    )

    /* optional: load new Qs */
    let newQuestions = currentRound.questions
    if (loadQuestionsForNewRound) {
      try {
        console.log('[useRoundProgress] Loading NEW questions for round', nextRoundNumber)
        newQuestions = await loadQuestionsForNewRound(nextRoundNumber)
        console.log('[useRoundProgress] Loaded', newQuestions.length,
                    'NEW questions for round', nextRoundNumber)
      } catch (err) {
        console.error('[useRoundProgress] Error loading questions:', err)
      }
    }

    setCurrentRound(prev => ({
      roundNumber: nextRoundNumber,
      narratorId: nextNarrator,
      questions: newQuestions,
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
