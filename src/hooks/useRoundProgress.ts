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
  const { state, dispatch } = useGame();
  const [showRoundBridge, setShowRoundBridge] = useState(false)
  const [nextNarrator, setNextNarrator] = useState<string>('')
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1)
  const [gameOver, setGameOver] = useState(false)

  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex
    const last = idx >= currentRound.questions.length - 1

    if (last) {
      // ▶️ Debug logging
      console.log('[useRoundProgress] Ending round', currentRound.roundNumber, 'current completed:', [...state.completedNarrators])

      // Mark narrator completed
      dispatch({ type: 'MARK_NARRATOR_COMPLETED', payload: currentRound.narratorId });

      // Build updated set locally
      const updatedCompleted = new Set([...state.completedNarrators, currentRound.narratorId]);
      console.log('[useRoundProgress] After mark, completedNarrators:', [...updatedCompleted]);

      // Find next narrator
      const nextNarratorId = state.originalNarratorQueue.find(id => !updatedCompleted.has(id));
      console.log('[useRoundProgress] Next narrator ID:', nextNarratorId);

      if (!nextNarratorId) {
        broadcastRoundEnd(currentRound.roundNumber, '', players, true);
        setGameOver(true);
      } else {
        const nextRound = currentRound.roundNumber + 1;
        setNextNarrator(nextNarratorId);
        setNextRoundNumber(nextRound);
        broadcastRoundEnd(currentRound.roundNumber, nextNarratorId, players);
        setShowRoundBridge(true);
      }
    } else {
      // same-round logic…
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

  // …rest of hook unchanged…

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
    // …
  }
}
