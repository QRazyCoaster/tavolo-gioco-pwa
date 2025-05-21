
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
    console.log('[useRoundProgress] Current round number:', currentRound.roundNumber);
    console.log('[useRoundProgress] Next round number state:', nextRoundNumber);
    console.log('[useRoundProgress] Total players:', players.length);
    console.log('[useRoundProgress] Game over state:', gameOver);
  }, [currentRound.roundNumber, nextRoundNumber, players.length, gameOver]);

  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex
    const last = idx >= QUESTIONS_PER_ROUND - 1

    if (last) {
      // end-of-round
      // Game over when current round number equals or exceeds total number of players
      console.log('[useRoundProgress] End of round. Current round:', currentRound.roundNumber, 'Players:', players.length);
      
      // Critical fix: Game should end when every player has had a turn as narrator
      // Since rounds are 1-based and we just finished the current round,
      // check if the current round number equals total players
      if (currentRound.roundNumber >= players.length) {
        console.log('[useRoundProgress] Game should end now. Final round completed.');
        broadcastRoundEnd(currentRound.roundNumber, '', players, true)
        setShowRoundBridge(true)
        setTimeout(() => {
          console.log('[useRoundProgress] Setting gameOver to true');
          setGameOver(true)
        }, 6500)
      } else {
        // prepare next narrator - use join order (array index)
        // Since rounds are 1-based and arrays are 0-based, use roundNumber as index
        // This is the critical fix - we use the current round number (not currentRound.roundNumber + 1)
        // to select the next narrator, which is correct since arrays are 0-indexed
        const nextId = players[currentRound.roundNumber]?.id || players[0].id
        const nextRoundNum = currentRound.roundNumber + 1

        console.log('[useRoundProgress] Setting up next round:', nextRoundNum, 'Next narrator:', nextId);
        
        setNextNarrator(nextId)
        setNextRoundNumber(nextRoundNum)
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
    console.log('[useRoundProgress] Starting next round:', nextRoundNumber, 'with narrator:', nextNarrator);
    
    setCurrentRound(prev => ({
      roundNumber: nextRoundNumber,
      narratorId: nextNarrator,
      questions: prev.questions.map(q => ({ ...q, id: `r${nextRoundNumber}-${q.id}` })),
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
