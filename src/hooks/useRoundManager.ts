
import { useState, useEffect } from 'react'
import { Round, TriviaQuestion } from '@/types/trivia'
import { useQuestionFetcher } from './useQuestionFetcher'
import { useLanguage } from '@/context/LanguageContext'
import {
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND
} from '@/utils/triviaConstants'

/**
 * Manages the current round's in‐memory state:
 *   • roundNumber, narratorId
 *   • questions array
 *   • currentQuestionIndex
 *   • queued playerAnswers
 *   • timeLeft
 * Also provides helpers to reset/advance the question locally.
 */
export function useRoundManager(hostId: string) {
  const { language } = useLanguage()
  const { questions: fetchedQuestions, loading, error } = useQuestionFetcher(language)
  
  const [currentRound, setCurrentRound] = useState<Round>({
    roundNumber: 1,
    narratorId: hostId,
    questions: [], // Start with empty array, will be populated when questions are fetched
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER,
  })

  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set())
  const [showPendingAnswers, setShowPendingAnswers] = useState(false)

  // Update round questions when fetched questions are available
  useEffect(() => {
    if (fetchedQuestions.length > 0) {
      console.log('[useRoundManager] Updating round with fetched questions:', fetchedQuestions)
      setCurrentRound(prev => ({
        ...prev,
        questions: fetchedQuestions.map((q): TriviaQuestion => ({ 
          ...q, 
          id: `r1-${q.id}` 
        }))
      }))
    }
  }, [fetchedQuestions])

  // Log any errors from question fetching
  useEffect(() => {
    if (error) {
      console.error('[useRoundManager] Error fetching questions:', error)
    }
  }, [error])

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
    questionsLoading: loading,
    questionsError: error,
  }
}
