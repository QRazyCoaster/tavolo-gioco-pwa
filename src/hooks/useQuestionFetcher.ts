
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
        .limit(100); // Get more than we need for better randomization

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

      // IMPROVED RANDOMIZATION: First shuffle all questions globally
      const shuffledQuestions = [...data].sort(() => Math.random() - 0.5);
      console.log('[useQuestionFetcher] Shuffled all questions globally');

      // Group shuffled questions by category for diversity
      const categorizedQuestions: { [category: string]: DatabaseQuestion[] } = {};
      shuffledQuestions.forEach((q: DatabaseQuestion) => {
        if (!categorizedQuestions[q.category]) {
          categorizedQuestions[q.category] = [];
        }
        categorizedQuestions[q.category].push(q);
      });

      console.log('[useQuestionFetcher] Questions grouped by category:', Object.keys(categorizedQuestions));

      // Select questions with better distribution
      const selectedQuestions: TriviaQuestion[] = [];
      const availableCategories = Object.keys(categorizedQuestions);
      const questionsNeeded = QUESTIONS_PER_ROUND;
      
      console.log('[useQuestionFetcher] Available categories:', availableCategories.length);
      console.log('[useQuestionFetcher] QUESTIONS_PER_ROUND:', QUESTIONS_PER_ROUND);
      
      if (availableCategories.length === 0) {
        console.warn('[useQuestionFetcher] No categories available');
        setQuestions([]);
        return;
      }

      // Strategy: Try to get one question from each category first, then fill remaining slots
      let questionsSelected = 0;
      let categoryIndex = 0;
      const usedQuestionIds = new Set<string>();

      // First pass: one question per category
      while (questionsSelected < questionsNeeded && categoryIndex < availableCategories.length) {
        const category = availableCategories[categoryIndex];
        const categoryQuestions = categorizedQuestions[category];
        
        // Find an unused question from this category
        const availableFromCategory = categoryQuestions.filter(q => !usedQuestionIds.has(q.id));
        
        if (availableFromCategory.length > 0) {
          // Pick the first available (already randomized from global shuffle)
          const selectedQuestion = availableFromCategory[0];
          
          // Transform database format to TriviaQuestion format
          const triviaQuestion: TriviaQuestion = {
            id: selectedQuestion.id,
            categoryId: selectedQuestion.category,
            textEn: '', // Empty for now since we only have Italian questions
            textIt: selectedQuestion.question,
            answerEn: '', // Empty for now since we only have Italian questions
            answerIt: selectedQuestion.correct_answer,
            difficulty: 'medium' as const // Default difficulty for now
          };
          
          selectedQuestions.push(triviaQuestion);
          usedQuestionIds.add(selectedQuestion.id);
          questionsSelected++;
        }
        
        categoryIndex++;
      }

      // Second pass: fill remaining slots with any available questions
      const allAvailableQuestions = shuffledQuestions.filter(q => !usedQuestionIds.has(q.id));
      
      while (questionsSelected < questionsNeeded && allAvailableQuestions.length > 0) {
        const randomQuestion = allAvailableQuestions.splice(
          Math.floor(Math.random() * allAvailableQuestions.length), 
          1
        )[0];
        
        const triviaQuestion: TriviaQuestion = {
          id: randomQuestion.id,
          categoryId: randomQuestion.category,
          textEn: '',
          textIt: randomQuestion.question,
          answerEn: '',
          answerIt: randomQuestion.correct_answer,
          difficulty: 'medium' as const
        };
        
        selectedQuestions.push(triviaQuestion);
        usedQuestionIds.add(randomQuestion.id);
        questionsSelected++;
      }

      // Final shuffle of selected questions
      const finalShuffledQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

      console.log('[useQuestionFetcher] Final selected questions:', finalShuffledQuestions);
      console.log('[useQuestionFetcher] Number of questions selected:', finalShuffledQuestions.length);
      console.log('[useQuestionFetcher] Categories in final selection:', 
        [...new Set(finalShuffledQuestions.map(q => q.categoryId))]);
      
      setQuestions(finalShuffledQuestions);

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
