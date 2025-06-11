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
      console.log('[useRoundProgress] ===== ROUND END LOGIC =====');
      console.log('[useRoundProgress] Current narrator completing:', currentRound.narratorId);
      console.log('[useRoundProgress] Original narrator queue:', state.originalNarratorQueue);
      console.log('[useRoundProgress] Currently completed narrators:', Array.from(state.completedNarrators));
      
      // Mark current narrator as completed
      dispatch({ type: 'MARK_NARRATOR_COMPLETED', payload: currentRound.narratorId });
      
      // Create updated completed narrators set (since dispatch is async)
      const updatedCompletedNarrators = new Set([...state.completedNarrators, currentRound.narratorId]);
      console.log('[useRoundProgress] Updated completed narrators:', Array.from(updatedCompletedNarrators));
      
      // Check if all narrators from original queue have completed
      const allNarratorsCompleted = updatedCompletedNarrators.size >= state.originalNarratorQueue.length;
      console.log('[useRoundProgress] All narrators completed?', allNarratorsCompleted, 
                  `(${updatedCompletedNarrators.size}/${state.originalNarratorQueue.length})`);
      
      if (allNarratorsCompleted) {
        // All narrators have had their turn - end game
        console.log('[useRoundProgress] ===== GAME OVER - ALL NARRATORS COMPLETED =====');
        broadcastRoundEnd(currentRound.roundNumber, '', players, true);
        setGameOver(true);
        return;
      }
      
      // Find next narrator from original queue who hasn't narrated yet
      const nextNarratorId = state.originalNarratorQueue.find(narratorId => 
        !updatedCompletedNarrators.has(narratorId)
      );
      
      console.log('[useRoundProgress] Next narrator from original queue:', nextNarratorId);
      
      if (!nextNarratorId) {
        // This shouldn't happen if our logic is correct, but handle gracefully
        console.log('[useRoundProgress] ERROR: No next narrator found but not all completed - ending game');
        broadcastRoundEnd(currentRound.roundNumber, '', players, true);
        setGameOver(true);
        return;
      }
      
      // Move to next round with next narrator
      const nextRound = currentRound.roundNumber + 1;
      console.log('[useRoundProgress] Moving to round', nextRound, 'with narrator:', nextNarratorId);
      
      setNextNarrator(nextNarratorId);
      setNextRoundNumber(nextRound);
      broadcastRoundEnd(currentRound.roundNumber, nextNarratorId, players);
      setShowRoundBridge(true);
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
    state.originalNarratorQueue,
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
    
    // Skip to round bridge with new narrator - next round number
    console.log('[useRoundProgress] Skipping to round bridge with new narrator:', nextNarratorId);
    setNextNarrator(nextNarratorId);
    setNextRoundNumber(currentRound.roundNumber + 1);
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
