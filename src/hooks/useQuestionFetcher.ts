
import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { TriviaQuestion } from '@/types/trivia';
import { Language } from '@/context/LanguageContext';

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

      // Select one question per category (up to 7 categories)
      const selectedQuestions: TriviaQuestion[] = [];
      const availableCategories = Object.keys(categorizedQuestions);
      
      availableCategories.forEach((category, index) => {
        if (index < 7) { // Limit to 7 questions per round
          const categoryQuestions = categorizedQuestions[category];
          const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
          
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
        }
      });

      console.log('[useQuestionFetcher] Final selected questions:', selectedQuestions);
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
