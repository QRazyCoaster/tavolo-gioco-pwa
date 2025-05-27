
import { useState, useEffect } from 'react'
import { Round, TriviaQuestion } from '@/types/trivia'
import { useLanguage } from '@/context/LanguageContext'
import { useGame } from '@/context/GameContext'
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
  const { state } = useGame();
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

  // Initialize question service with game ID when available
  useEffect(() => {
    if (state.gameId) {
      console.log('[useRoundManager] Initializing question service for game:', state.gameId);
      questionService.setGameId(state.gameId);
    }
  }, [state.gameId]);

  // Load questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      if (!state.gameId) {
        console.log('[useRoundManager] No gameId available, waiting...');
        return;
      }

      try {
        console.log('[useRoundManager] Loading questions for language:', language, 'game:', state.gameId);
        setQuestionsError(null);
        
        // Fetch from database
        const questions = await questionService.fetchQuestionsByLanguage(language);
        console.log('[useRoundManager] Fetched questions from database:', questions.length);
        
        if (questions.length === 0) {
          throw new Error('No questions found in database');
        }

        // Check if we have at least one question per category
        const categoriesRepresented = new Set(questions.map(q => q.category));
        console.log('[useRoundManager] Categories in database:', [...categoriesRepresented]);
        
        if (categoriesRepresented.size < 7) {
          console.warn('[useRoundManager] Database missing some categories, only has:', categoriesRepresented.size);
        }

        // Select questions for the round
        const selectedQuestions = questionService.selectQuestionsForRound(questions);
        console.log('[useRoundManager] Selected questions for round:', selectedQuestions.length);
        
        if (selectedQuestions.length === 0) {
          throw new Error('No questions could be selected from database');
        }

        const questionsWithRoundId = selectedQuestions.map((q): TriviaQuestion => ({ 
          ...q, 
          id: `r1-${q.id}` 
        }));

        console.log('[useRoundManager] Successfully loaded database questions for round 1');
        selectedQuestions.forEach((q, index) => {
          console.log(`[useRoundManager] Q${index + 1} [${q.category}]:`, q.question.substring(0, 50) + '...');
        });

        setCurrentRound(prev => ({
          ...prev,
          questions: questionsWithRoundId
        }));
        
        setQuestionsLoaded(true);
        
      } catch (error) {
        console.error('[useRoundManager] Database completely unavailable, using EXTREME fallback questions:', error);
        setQuestionsError('Database unavailable - using backup questions');
        
        // EXTREME FALLBACK: Only use when database is completely unavailable
        const fallbackQuestions = language === 'it' ? mockQuestionsItalian : mockQuestions;
        const questionsWithRoundId = fallbackQuestions.slice(0, 7).map((q): TriviaQuestion => ({ 
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
  }, [language, state.gameId]);

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
      console.log('[useRoundManager] Loading questions for NEW round:', roundNumber, 'game:', state.gameId);
      
      // Fetch from database
      const questions = await questionService.fetchQuestionsByLanguage(language);
      console.log('[useRoundManager] Fetched questions for round', roundNumber, ':', questions.length);
      
      if (questions.length === 0) {
        throw new Error('No questions found in database');
      }

      const selectedQuestions = questionService.selectQuestionsForRound(questions);
      console.log('[useRoundManager] Selected questions for round', roundNumber, ':', selectedQuestions.length);
      
      if (selectedQuestions.length === 0) {
        throw new Error('No questions could be selected from database');
      }

      const questionsWithRoundId = selectedQuestions.map((q): TriviaQuestion => ({ 
        ...q, 
        id: `r${roundNumber}-${q.id}` 
      }));

      console.log('[useRoundManager] Successfully loaded database questions for round', roundNumber);
      selectedQuestions.forEach((q, index) => {
        console.log(`[useRoundManager] R${roundNumber} Q${index + 1} [${q.category}]:`, q.question.substring(0, 50) + '...');
      });
      
      return questionsWithRoundId;
      
    } catch (error) {
      console.error('[useRoundManager] Error loading questions for round', roundNumber, ', using extreme fallback:', error);
      
      // EXTREME FALLBACK: Only use when database is completely unavailable
      const fallbackQuestions = language === 'it' ? mockQuestionsItalian : mockQuestions;
      const questionsWithRoundId = fallbackQuestions.slice(0, 7).map((q): TriviaQuestion => ({ 
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
