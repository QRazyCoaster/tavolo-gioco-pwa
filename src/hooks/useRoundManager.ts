
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
        
        // Try to fetch from database
        const questions = await questionService.fetchQuestionsByLanguage(language);
        
        if (questions.length === 0) {
          throw new Error('No questions found in database - using extreme fallback');
        }

        // Try to select questions for the round
        const selectedQuestions = questionService.selectQuestionsForRound(questions);
        
        if (selectedQuestions.length < QUESTIONS_PER_ROUND) {
          console.warn('[useRoundManager] Database returned insufficient questions, using extreme fallback');
          throw new Error('Insufficient questions from database - using extreme fallback');
        }

        const questionsWithRoundId = selectedQuestions.map((q): TriviaQuestion => ({ 
          ...q, 
          id: `r1-${q.id}` 
        }));

        console.log('[useRoundManager] Successfully loaded database questions:', questionsWithRoundId.length);
        questionsWithRoundId.forEach(q => {
          console.log('[useRoundManager] Question loaded:', q.category, '-', q.question.substring(0, 50) + '...');
        });

        setCurrentRound(prev => ({
          ...prev,
          questions: questionsWithRoundId
        }));
        
        setQuestionsLoaded(true);
        
      } catch (error) {
        console.error('[useRoundManager] Database unavailable, using EXTREME fallback questions:', error);
        setQuestionsError('Database unavailable - using backup questions');
        
        // EXTREME FALLBACK: Only use when database is completely unavailable
        const fallbackQuestions = language === 'it' ? mockQuestionsItalian : mockQuestions;
        const questionsWithRoundId = fallbackQuestions.map((q): TriviaQuestion => ({ 
          ...q, 
          id: `r1-fallback-${q.id}` 
        }));
        
        console.log('[useRoundManager] Using extreme fallback questions:', questionsWithRoundId.length);
        
        setCurrentRound(prev => ({
          ...prev,
          questions: questionsWithRoundId
        }));
        
        setQuestionsLoaded(true);
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
      
      // Try to fetch from database
      const questions = await questionService.fetchQuestionsByLanguage(language);
      
      if (questions.length === 0) {
        throw new Error('No questions found in database');
      }

      const selectedQuestions = questionService.selectQuestionsForRound(questions);
      
      if (selectedQuestions.length < QUESTIONS_PER_ROUND) {
        throw new Error('Insufficient questions from database');
      }

      const questionsWithRoundId = selectedQuestions.map((q): TriviaQuestion => ({ 
        ...q, 
        id: `r${roundNumber}-${q.id}` 
      }));

      console.log('[useRoundManager] Successfully loaded questions for round', roundNumber, ':', questionsWithRoundId.length);
      return questionsWithRoundId;
      
    } catch (error) {
      console.error('[useRoundManager] Error loading questions for new round, using extreme fallback:', error);
      
      // EXTREME FALLBACK: Only use when database is completely unavailable
      const fallbackQuestions = language === 'it' ? mockQuestionsItalian : mockQuestions;
      const questionsWithRoundId = fallbackQuestions.map((q): TriviaQuestion => ({ 
        ...q, 
        id: `r${roundNumber}-fallback-${q.id}` 
      }));
      
      console.log('[useRoundManager] Using extreme fallback for round', roundNumber);
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
