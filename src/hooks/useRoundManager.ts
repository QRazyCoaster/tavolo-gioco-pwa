
import { useState, useEffect } from 'react'
import { Round, TriviaQuestion } from '@/types/trivia'
import { useLanguage } from '@/context/LanguageContext'
import { questionService } from '@/services/questionService'
import {
  mockQuestions,
  mockQuestionsItalian,
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND
} from '@/utils/triviaConstants'

/**
 * Manages the current round's in‐memory state:
 *   • roundNumber, narratorId
 *   • questions array (now fetched from Supabase)
 *   • currentQuestionIndex
 *   • queued playerAnswers
 *   • timeLeft
 * Also provides helpers to reset/advance the question locally.
 */
export function useRoundManager(hostId: string) {
  const { language } = useLanguage();
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [currentRound, setCurrentRound] = useState<Round>({
    roundNumber: 1,
    narratorId: hostId,
    questions: [],
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER,
  })

  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set())
  const [showPendingAnswers, setShowPendingAnswers] = useState(false)

  // Load questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        console.log('[useRoundManager] Loading questions for language:', language);
        setQuestionsError(null);
        
        const questions = await questionService.fetchQuestionsByLanguage(language);
        
        if (questions.length === 0) {
          throw new Error('No questions found in database');
        }

        const selectedQuestions = questionService.selectQuestionsForRound(questions);
        
        if (selectedQuestions.length < QUESTIONS_PER_ROUND) {
          console.warn('[useRoundManager] Only got', selectedQuestions.length, 'questions, using fallback');
          throw new Error('Insufficient questions available');
        }

        const questionsWithRoundId = selectedQuestions.map((q): TriviaQuestion => ({ 
          ...q, 
          id: `r1-${q.id}` 
        }));

        setCurrentRound(prev => ({
          ...prev,
          questions: questionsWithRoundId
        }));
        
        setQuestionsLoaded(true);
        console.log('[useRoundManager] Successfully loaded', questionsWithRoundId.length, 'questions');
        
      } catch (error) {
        console.error('[useRoundManager] Error loading questions:', error);
        setQuestionsError(error instanceof Error ? error.message : 'Unknown error');
        
        // Fallback to mock questions
        const fallbackQuestions = language === 'it' ? mockQuestionsItalian : mockQuestions;
        const questionsWithRoundId = fallbackQuestions.map((q): TriviaQuestion => ({ 
          ...q, 
          id: `r1-${q.id}` 
        }));
        
        setCurrentRound(prev => ({
          ...prev,
          questions: questionsWithRoundId
        }));
        
        setQuestionsLoaded(true);
        console.log('[useRoundManager] Using fallback questions');
      }
    };

    loadQuestions();
  }, [language]);

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

  /**
   * Load questions for a new round
   */
  const loadQuestionsForNewRound = async (roundNumber: number) => {
    try {
      console.log('[useRoundManager] Loading questions for new round:', roundNumber);
      
      const questions = await questionService.fetchQuestionsByLanguage(language);
      const selectedQuestions = questionService.selectQuestionsForRound(questions);
      
      if (selectedQuestions.length < QUESTIONS_PER_ROUND) {
        // Use fallback questions if not enough available
        const fallbackQuestions = language === 'it' ? mockQuestionsItalian : mockQuestions;
        const questionsWithRoundId = fallbackQuestions.map((q): TriviaQuestion => ({ 
          ...q, 
          id: `r${roundNumber}-${q.id}` 
        }));
        return questionsWithRoundId;
      }

      const questionsWithRoundId = selectedQuestions.map((q): TriviaQuestion => ({ 
        ...q, 
        id: `r${roundNumber}-${q.id}` 
      }));

      return questionsWithRoundId;
      
    } catch (error) {
      console.error('[useRoundManager] Error loading questions for new round:', error);
      
      // Fallback to mock questions
      const fallbackQuestions = language === 'it' ? mockQuestionsItalian : mockQuestions;
      const questionsWithRoundId = fallbackQuestions.map((q): TriviaQuestion => ({ 
        ...q, 
        id: `r${roundNumber}-${q.id}` 
      }));
      
      return questionsWithRoundId;
    }
  };

  return {
    currentRound,
    setCurrentRound,
    answeredPlayers,
    setAnsweredPlayers,
    showPendingAnswers,
    setShowPendingAnswers,
    resetForNextQuestion,
    advanceQuestionLocal,
    loadQuestionsForNewRound,
    questionsLoaded,
    questionsError,
  }
}
