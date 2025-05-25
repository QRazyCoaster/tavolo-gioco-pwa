
import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { TriviaQuestion } from '@/types/trivia';
import { Language } from '@/context/LanguageContext';
import { QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';

interface DatabaseQuestion {
  id: string;
  language: string;
  category: string;
  question: string;
  correct_answer: string;
  created_at: string;
}

export const useQuestionFetcher = (language: Language = 'it') => {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = async () => {
    console.log('[useQuestionFetcher] Starting to fetch questions for language:', language);
    setLoading(true);
    setError(null);

    try {
      // Fetch questions from Supabase, filtering by language
      const { data, error: fetchError } = await supabase
        .from('trivia_questions')
        .select('*')
        .eq('language', language)
        .limit(50); // Get more than we need to ensure we have options

      if (fetchError) {
        console.error('[useQuestionFetcher] Database error:', fetchError);
        throw fetchError;
      }

      console.log('[useQuestionFetcher] Raw data from database:', data);

      if (!data || data.length === 0) {
        console.warn('[useQuestionFetcher] No questions found for language:', language);
        setQuestions([]);
        return;
      }

      // Group questions by category
      const categorizedQuestions: { [category: string]: DatabaseQuestion[] } = {};
      data.forEach((q: DatabaseQuestion) => {
        if (!categorizedQuestions[q.category]) {
          categorizedQuestions[q.category] = [];
        }
        categorizedQuestions[q.category].push(q);
      });

      console.log('[useQuestionFetcher] Questions grouped by category:', categorizedQuestions);

      // Select one question per category (up to QUESTIONS_PER_ROUND)
      const selectedQuestions: TriviaQuestion[] = [];
      const availableCategories = Object.keys(categorizedQuestions);
      
      console.log('[useQuestionFetcher] Available categories:', availableCategories.length);
      console.log('[useQuestionFetcher] QUESTIONS_PER_ROUND:', QUESTIONS_PER_ROUND);
      
      // If we have fewer categories than QUESTIONS_PER_ROUND, select multiple questions from some categories
      const questionsNeeded = QUESTIONS_PER_ROUND;
      let questionsSelected = 0;
      let categoryIndex = 0;
      
      while (questionsSelected < questionsNeeded && availableCategories.length > 0) {
        const category = availableCategories[categoryIndex % availableCategories.length];
        const categoryQuestions = categorizedQuestions[category];
        
        if (categoryQuestions.length > 0) {
          // Select a random question from this category that hasn't been used
          const availableFromCategory = categoryQuestions.filter(q => 
            !selectedQuestions.some(selected => selected.id === q.id)
          );
          
          if (availableFromCategory.length > 0) {
            const randomQuestion = availableFromCategory[Math.floor(Math.random() * availableFromCategory.length)];
            
            // Transform database format to TriviaQuestion format
            const triviaQuestion: TriviaQuestion = {
              id: randomQuestion.id,
              categoryId: randomQuestion.category,
              textEn: '', // Empty for now since we only have Italian questions
              textIt: randomQuestion.question,
              answerEn: '', // Empty for now since we only have Italian questions
              answerIt: randomQuestion.correct_answer,
              difficulty: 'medium' as const // Default difficulty for now
            };
            
            selectedQuestions.push(triviaQuestion);
            questionsSelected++;
          }
        }
        
        categoryIndex++;
        
        // Safety check to prevent infinite loop
        if (categoryIndex > availableCategories.length * questionsNeeded) {
          console.warn('[useQuestionFetcher] Could not fetch enough questions, stopping at:', questionsSelected);
          break;
        }
      }

      console.log('[useQuestionFetcher] Final selected questions:', selectedQuestions);
      console.log('[useQuestionFetcher] Number of questions selected:', selectedQuestions.length);
      setQuestions(selectedQuestions);

    } catch (err) {
      console.error('[useQuestionFetcher] Error fetching questions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [language]);

  return {
    questions,
    loading,
    error,
    refetch: fetchQuestions
  };
};
