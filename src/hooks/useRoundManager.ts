
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
    narratorId: state.originalNarratorQueue[0] || hostId, // Use first from original queue
    questions: [],
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER,
  })


  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set())
  const [showPendingAnswers, setShowPendingAnswers] = useState(false)

  useEffect(() => {
    if (state.gameId) {
      questionService.setGameId(state.gameId);
    }
  }, [state.gameId]);

  useEffect(() => {
    const loadQuestions = async () => {
      if (!state.gameId) {
        return;
      }

      try {
        setQuestionsError(null);
        
        const questions = await questionService.fetchQuestionsByLanguage(language);
        
        if (questions.length === 0) {
          throw new Error('No questions found in database');
        }

        const selectedQuestions = questionService.selectQuestionsForRound(questions);
        
        if (selectedQuestions.length === 0) {
          throw new Error('No questions could be selected from database');
        }

        const questionsWithRoundId = selectedQuestions.map((q): TriviaQuestion => ({ 
          ...q, 
          id: `r1-${q.id}` 
        }));

        setCurrentRound(prev => ({
          ...prev,
          questions: questionsWithRoundId,
          narratorId: state.originalNarratorQueue[0] || hostId
        }));
        
        setQuestionsLoaded(true);
        
      } catch (error) {
        setQuestionsError('Database unavailable - using backup questions');
        
        const fallbackQuestions = language === 'it' ? mockQuestionsItalian : mockQuestions;
        const questionsWithRoundId = fallbackQuestions.slice(0, 7).map((q): TriviaQuestion => ({ 
          ...q, 
          id: `r1-fallback-${q.id}` 
        }));
        
        setCurrentRound(prev => ({
          ...prev,
          questions: questionsWithRoundId,
          narratorId: state.originalNarratorQueue[0] || hostId
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
      const questions = await questionService.fetchQuestionsByLanguage(language);
      
      if (questions.length === 0) {
        throw new Error('No questions found in database');
      }

      const selectedQuestions = questionService.selectQuestionsForRound(questions);
      
      if (selectedQuestions.length === 0) {
        throw new Error('No questions could be selected from database');
      }

      const questionsWithRoundId = selectedQuestions.map((q): TriviaQuestion => ({ 
        ...q, 
        id: `r${roundNumber}-${q.id}` 
      }));
      
      return questionsWithRoundId;
      
    } catch (error) {
      const fallbackQuestions = language === 'it' ? mockQuestionsItalian : mockQuestions;
      const questionsWithRoundId = fallbackQuestions.slice(0, 7).map((q): TriviaQuestion => ({ 
        ...q, 
        id: `r${roundNumber}-fallback-${q.id}` 
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
