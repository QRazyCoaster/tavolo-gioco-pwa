import { useState } from 'react'
import { Round, TriviaQuestion } from '@/types/trivia'
import {
  mockQuestions,
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND
} from '@/utils/triviaConstants'

/**
 * Manages the current round’s in‐memory state:
 *   • roundNumber, narratorId
 *   • questions array
 *   • currentQuestionIndex
 *   • queued playerAnswers
 *   • timeLeft
 * Also provides helpers to reset/advance the question locally.
 */
export function useRoundManager(hostId: string) {
  const [currentRound, setCurrentRound] = useState<Round>({
    roundNumber: 1,
    narratorId: hostId,
    questions: mockQuestions
      .slice(0, QUESTIONS_PER_ROUND)
      .map((q): TriviaQuestion => ({ ...q, id: `r1-${q.id}` })),
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER,
  })

  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set())
  const [showPendingAnswers, setShowPendingAnswers] = useState(false)

  /** Clears answers + resets timer for the next question in the same round */
  const resetForNextQuestion = () => {
    setCurrentRound(prev => ({
      ...prev,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER,
    }))
    setAnsweredPlayers(new Set())
    setShowPendingAnswers(false)
  }

  /**
   * Immediately jump to a given question index (e.g. on broadcast),
   * clearing out answers + resetting timer.
   */
  const advanceQuestionLocal = (index: number) => {
    setCurrentRound(prev => ({
      ...prev,
      currentQuestionIndex: index,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER,
    }))
    setAnsweredPlayers(new Set())
    setShowPendingAnswers(false)
  }

  return {
    currentRound,
    setCurrentRound,
    answeredPlayers,
    setAnsweredPlayers,
    showPendingAnswers,
    setShowPendingAnswers,
    resetForNextQuestion,
    advanceQuestionLocal,
  }
}
