
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
        .eq('language', language);

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

      const availableCategories = Object.keys(categorizedQuestions);
      console.log('[useQuestionFetcher] Available categories:', availableCategories);
      console.log('[useQuestionFetcher] Questions per category:', 
        Object.fromEntries(availableCategories.map(cat => [cat, categorizedQuestions[cat].length]))
      );

      if (availableCategories.length === 0) {
        console.warn('[useQuestionFetcher] No categories available');
        setQuestions([]);
        return;
      }

      // NEW STRATEGY: Guarantee exactly one question per category
      // Shuffle the categories to randomize selection order
      const shuffledCategories = [...availableCategories].sort(() => Math.random() - 0.5);
      console.log('[useQuestionFetcher] Shuffled categories order:', shuffledCategories);

      const selectedQuestions: TriviaQuestion[] = [];
      const usedQuestionIds = new Set<string>();

      // Take exactly one question from each category (up to QUESTIONS_PER_ROUND)
      const categoriesToUse = shuffledCategories.slice(0, QUESTIONS_PER_ROUND);
      console.log('[useQuestionFetcher] Using categories for this round:', categoriesToUse);

      categoriesToUse.forEach((category, index) => {
        const categoryQuestions = categorizedQuestions[category];
        
        // Shuffle questions within this category
        const shuffledCategoryQuestions = [...categoryQuestions].sort(() => Math.random() - 0.5);
        
        // Find an unused question from this category
        const availableFromCategory = shuffledCategoryQuestions.filter(q => !usedQuestionIds.has(q.id));
        
        if (availableFromCategory.length > 0) {
          const selectedQuestion = availableFromCategory[0];
          
          console.log(`[useQuestionFetcher] Selected question ${index + 1} from category "${category}":`, selectedQuestion.question.substring(0, 50) + '...');
          
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
        } else {
          console.warn(`[useQuestionFetcher] No available questions found in category: ${category}`);
        }
      });

      // If we don't have enough categories to fill QUESTIONS_PER_ROUND, 
      // fill remaining slots with random questions from any category
      while (selectedQuestions.length < QUESTIONS_PER_ROUND) {
        const allAvailableQuestions = data.filter(q => !usedQuestionIds.has(q.id));
        
        if (allAvailableQuestions.length === 0) {
          console.warn('[useQuestionFetcher] No more questions available to fill remaining slots');
          break;
        }
        
        const randomQuestion = allAvailableQuestions[Math.floor(Math.random() * allAvailableQuestions.length)];
        
        console.log(`[useQuestionFetcher] Filling slot ${selectedQuestions.length + 1} with random question from category "${randomQuestion.category}"`);
        
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
      }

      // Final shuffle of the selected questions to randomize their order
      const finalShuffledQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

      console.log('[useQuestionFetcher] Final selected questions:', finalShuffledQuestions.length);
      console.log('[useQuestionFetcher] Categories in final selection:', 
        [...new Set(finalShuffledQuestions.map(q => q.categoryId))]);
      console.log('[useQuestionFetcher] Question IDs:', finalShuffledQuestions.map(q => q.id));
      
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
