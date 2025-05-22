
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
  // -- REMOVED nextRoundNumber state entirely --                        ← CHANGED
  const [gameOver, setGameOver] = useState(false)

  // Debug effect for round progression
  useEffect(() => {
    console.log('[useRoundProgress] Current round number:', currentRound.roundNumber);
    console.log('[useRoundProgress] Total players:', players.length);
    console.log('[useRoundProgress] Game over state:', gameOver);
  }, [currentRound.roundNumber, players.length, gameOver]);

  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex
    const last = idx >= QUESTIONS_PER_ROUND - 1

    if (last) {
      // end-of-round
      console.log(
        '[useRoundProgress] End of round.',
        'Current round:', currentRound.roundNumber,
        'Players:', players.length
      )
      
      if (currentRound.roundNumber >= players.length) {
        // FINAL ROUND
        console.log('[useRoundProgress] Game should end now.');
        broadcastRoundEnd(currentRound.roundNumber, '', players, true)
        setShowRoundBridge(true)
        setTimeout(() => {
          console.log('[useRoundProgress] Setting gameOver to true');
          setGameOver(true)
        }, 6500)
      } else {
        // NEXT ROUND
        // Use currentRound.roundNumber as zero-based index to pick next narrator
        const nextId = players[currentRound.roundNumber]?.id || players[0].id
        console.log(
          '[useRoundProgress] Preparing next round:',
          currentRound.roundNumber + 1,
          'Next narrator:', nextId
        )
        setNextNarrator(nextId)
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
    console.log(
      '[useRoundProgress] Starting next round:',
      currentRound.roundNumber + 1,
      'with narrator:',
      nextNarrator
    )
    
    setCurrentRound(prev => ({
      // Derive new round number directly from prev.roundNumber
      roundNumber: prev.roundNumber + 1,                                    // ← CHANGED
      narratorId: nextNarrator,
      questions: prev.questions.map(q => ({
        ...q,
        id: `r${prev.roundNumber + 1}-${q.id}`                            // ← CHANGED
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
    // -- REMOVED nextRoundNumber & setNextRoundNumber from return --   ← CHANGED
    gameOver,
    setGameOver,
    handleNextQuestion,
    startNextRound
  }
}
