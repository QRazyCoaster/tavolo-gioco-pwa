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
      
      // Mark current narrator as completed
      dispatch({ type: 'MARK_NARRATOR_COMPLETED', payload: currentRound.narratorId });
      
      // Find next narrator from remaining players who haven't narrated yet
      const activePlayers = getActivePlayers?.() || [];
      const activePlayerIds = activePlayers.map(p => p.id);
      
      // Find next narrator from players who haven't been narrator yet and are active
      const remainingNarrators = players
        .filter(p => !state.completedNarrators.has(p.id) && activePlayerIds.includes(p.id))
        .map(p => p.id);
      
      console.log('[useRoundProgress] Remaining narrators:', remainingNarrators);
      console.log('[useRoundProgress] Completed narrators:', Array.from(state.completedNarrators));
      
      if (remainingNarrators.length === 0) {
        // No more narrators - end game
        console.log('[useRoundProgress] All narrators completed, ending game');
        broadcastRoundEnd(currentRound.roundNumber, '', players, true);
        setGameOver(true);
      } else {
        // Move to next round with next narrator
        const nextNarratorId = remainingNarrators[0]; // Take first available
        const nextRound = currentRound.roundNumber + 1;
        
        console.log('[useRoundProgress] Next narrator:', nextNarratorId, 'Next round:', nextRound);
        
        setNextNarrator(nextNarratorId);
        setNextRoundNumber(nextRound);
        broadcastRoundEnd(currentRound.roundNumber, nextNarratorId, players);
        setShowRoundBridge(true);
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
    state.completedNarrators,
    dispatch
  ])


  /* ──────────────────────────── */
  const handleNarratorDisconnection = useCallback((nextNarratorId: string | null) => {
    console.log('[useRoundProgress] Handling narrator disconnection, next narrator:', nextNarratorId);
    
    // Mark current narrator as completed even if they disconnected
    dispatch({ type: 'MARK_NARRATOR_COMPLETED', payload: currentRound.narratorId });
    
    if (!nextNarratorId) {
      // No more valid narrators - end game
      console.log('[useRoundProgress] Ending game due to no more narrators');
      broadcastRoundEnd(currentRound.roundNumber, '', players, true);
      setGameOver(true);
      return;
    }
    
    // Skip to round bridge with new narrator - keep same round number since we're replacing
    console.log('[useRoundProgress] Skipping to round bridge with new narrator:', nextNarratorId);
    setNextNarrator(nextNarratorId);
    setNextRoundNumber(currentRound.roundNumber + 1); // Next round number for display
    broadcastRoundEnd(currentRound.roundNumber, nextNarratorId, players);
    setShowRoundBridge(true);
  }, [currentRound.roundNumber, currentRound.narratorId, players, dispatch])

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
