// src/hooks/useRoundProgress.ts
import { useState, useCallback, useEffect } from 'react'
import { Round } from '@/types/trivia'
import { QUESTION_TIMER, QUESTIONS_PER_ROUND } from '@/utils/triviaConstants'
import { broadcastNextQuestion, broadcastRoundEnd } from '@/utils/triviaBroadcast'
import { Player, useGame } from '@/context/GameContext'

/**
 * Manages advancing through questions and rounds.
 */
export const useRoundProgress = (
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  players: Player[],
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPending: React.Dispatch<React.SetStateAction<boolean>>,
  loadQuestionsForNewRound?: (roundNumber: number) => Promise<any[]>,
  getActivePlayers?: () => Player[]
) => {
  const { state, dispatch } = useGame();
  const [showRoundBridge, setShowRoundBridge] = useState(false)
  const [nextNarrator, setNextNarrator] = useState<string>('')
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1)
  const [gameOver, setGameOver] = useState(false)

  // Debug effect removed - enable for debugging if needed

  /* ──────────────────────────── */
  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex
    const last = idx >= currentRound.questions.length - 1

    if (last) {
        // End of round logic

      // Check if all original players have completed their narrator turns
      const allNarratorsCompleted = state.originalNarratorQueue.every(playerId => 
        state.completedNarrators.has(playerId) || !getActivePlayers().some(p => p.id === playerId)
      );
      
      if (allNarratorsCompleted) {
        /* FINAL ROUND */
        // All original narrators have had their turn - end game
        console.log('[useRoundProgress] All narrators completed, ending game');
        dispatch({ type: 'MARK_NARRATOR_COMPLETED', payload: currentRound.narratorId });
        broadcastRoundEnd(currentRound.roundNumber, '', players, true);
        setGameOver(true);
      } else {
        /* NEXT ROUND */
        // Transition to next round

        /* --- Choose next narrator based on original queue --- */
        const nextNarratorId = getNextNarratorFromOriginalQueue()
        
        if (!nextNarratorId) {
          console.log('[useRoundProgress] No more narrators in queue - ending game')
          broadcastRoundEnd(currentRound.roundNumber, '', players, true)
          setGameOver(true)
          return
        }

        // Mark current narrator as completed
        dispatch({ type: 'MARK_NARRATOR_COMPLETED', payload: currentRound.narratorId })
        
        setNextNarrator(nextNarratorId)
        setNextRoundNumber(currentRound.roundNumber + 1)
        broadcastRoundEnd(currentRound.roundNumber, nextNarratorId, players)
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
    setShowPending,
    getActivePlayers,
    state.originalNarratorQueue,
    state.completedNarrators,
    dispatch
  ])

  /* ──────────────────────────── */
  const getNextNarratorFromOriginalQueue = useCallback(() => {
    console.log('[useRoundProgress] Getting next narrator from original queue')
    console.log('[useRoundProgress] Original queue:', state.originalNarratorQueue)
    console.log('[useRoundProgress] Completed narrators:', Array.from(state.completedNarrators))
    
    if (!getActivePlayers) {
      console.log('[useRoundProgress] No getActivePlayers function available')
      return null
    }
    
    const activePlayers = getActivePlayers()
    const activePlayerIds = new Set(activePlayers.map(p => p.id))
    console.log('[useRoundProgress] Active players:', Array.from(activePlayerIds))
    
    // Find next narrator from original queue who:
    // 1. Hasn't been narrator yet
    // 2. Is currently active
    for (const playerId of state.originalNarratorQueue) {
      if (!state.completedNarrators.has(playerId) && activePlayerIds.has(playerId)) {
        console.log('[useRoundProgress] Found next narrator:', playerId)
        return playerId
      }
    }
    
    console.log('[useRoundProgress] No valid next narrator found')
    return null
  }, [state.originalNarratorQueue, state.completedNarrators, getActivePlayers])

  /* ──────────────────────────── */
  const handleNarratorDisconnection = useCallback((nextNarratorId: string | null) => {
    console.log('[useRoundProgress] Handling narrator disconnection, next narrator:', nextNarratorId);
    
    // Mark current narrator as completed even if they disconnected
    dispatch({ type: 'MARK_NARRATOR_COMPLETED', payload: currentRound.narratorId })
    
    if (!nextNarratorId) {
      // No active players left or no more narrators in queue - end game
      console.log('[useRoundProgress] Ending game due to narrator disconnection');
      broadcastRoundEnd(currentRound.roundNumber, '', players, true);
      setGameOver(true);
      return;
    }
    
    // Skip to round bridge with new narrator
    console.log('[useRoundProgress] Skipping to round bridge with new narrator:', nextNarratorId);
    setNextNarrator(nextNarratorId);
    setNextRoundNumber(currentRound.roundNumber + 1);
    broadcastRoundEnd(currentRound.roundNumber, nextNarratorId, players);
    setShowRoundBridge(true);
  }, [currentRound.roundNumber, currentRound.narratorId, players, setNextNarrator, setNextRoundNumber, setShowRoundBridge, setGameOver, dispatch])

  /* ──────────────────────────── */
  const startNextRound = async () => {

    /* optional: load new Qs */
    let newQuestions = currentRound.questions
    if (loadQuestionsForNewRound) {
      try {
        newQuestions = await loadQuestionsForNewRound(nextRoundNumber)
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
    startNextRound,
    handleNarratorDisconnection
  }
}
