
import { supabase } from '@/supabaseClient';
import { TriviaQuestion } from '@/types/trivia';
import { CATEGORIES, type QuestionCategory } from '@/utils/questionConstants';

const USED_QUESTIONS_KEY = 'trivia_used_questions';

export class QuestionService {
  private static instance: QuestionService;
  private usedQuestions: Set<string> = new Set();

  private constructor() {
    this.loadUsedQuestions();
  }

  static getInstance(): QuestionService {
    if (!QuestionService.instance) {
      QuestionService.instance = new QuestionService();
    }
    return QuestionService.instance;
  }

  private loadUsedQuestions(): void {
    try {
      const stored = localStorage.getItem(USED_QUESTIONS_KEY);
      if (stored) {
        this.usedQuestions = new Set(JSON.parse(stored));
        console.log('[QuestionService] Loaded', this.usedQuestions.size, 'used questions from storage');
      }
    } catch (error) {
      console.error('[QuestionService] Error loading used questions:', error);
      this.usedQuestions = new Set();
    }
  }

  private saveUsedQuestions(): void {
    try {
      localStorage.setItem(USED_QUESTIONS_KEY, JSON.stringify([...this.usedQuestions]));
      console.log('[QuestionService] Saved', this.usedQuestions.size, 'used questions to storage');
    } catch (error) {
      console.error('[QuestionService] Error saving used questions:', error);
    }
  }

  async fetchQuestionsByLanguage(language: 'en' | 'it'): Promise<TriviaQuestion[]> {
    console.log('[QuestionService] Fetching questions for language:', language);
    
    const { data, error } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('language', language);

    if (error) {
      console.error('[QuestionService] Error fetching questions:', error);
      throw error;
    }

    console.log('[QuestionService] Fetched', data?.length || 0, 'questions from database');
    return data || [];
  }

  selectQuestionsForRound(availableQuestions: TriviaQuestion[]): TriviaQuestion[] {
    console.log('[QuestionService] Starting question selection');
    console.log('[QuestionService] Available questions:', availableQuestions.length);
    console.log('[QuestionService] Used questions count:', this.usedQuestions.size);
    
    const selectedQuestions: TriviaQuestion[] = [];

    // Group questions by category, excluding already used ones
    const questionsByCategory = CATEGORIES.reduce((acc, category) => {
      const categoryQuestions = availableQuestions.filter(q => 
        q.category === category && !this.usedQuestions.has(q.id)
      );
      acc[category] = categoryQuestions;
      console.log(`[QuestionService] Category ${category}: ${categoryQuestions.length} unused questions`);
      return acc;
    }, {} as Record<QuestionCategory, TriviaQuestion[]>);

    // Check if we need to reset used questions
    const totalAvailableUnused = Object.values(questionsByCategory).reduce((sum, questions) => sum + questions.length, 0);
    console.log('[QuestionService] Total unused questions across all categories:', totalAvailableUnused);
    
    if (totalAvailableUnused < 7) {
      console.log('[QuestionService] Insufficient unused questions, resetting used questions pool');
      this.resetUsedQuestions();
      
      // Rebuild the groups without used questions filter
      CATEGORIES.forEach(category => {
        questionsByCategory[category] = availableQuestions.filter(q => q.category === category);
        console.log(`[QuestionService] After reset - Category ${category}: ${questionsByCategory[category].length} questions`);
      });
    }

    // Select one random question from each category
    for (const category of CATEGORIES) {
      const categoryQuestions = questionsByCategory[category];
      
      if (categoryQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
        const selectedQuestion = categoryQuestions[randomIndex];
        selectedQuestions.push(selectedQuestion);
        
        console.log('[QuestionService] Selected question from category', category, ':', selectedQuestion.id, '-', selectedQuestion.question.substring(0, 50) + '...');
      } else {
        console.warn('[QuestionService] No questions available for category:', category);
      }
    }

    // Mark selected questions as used
    selectedQuestions.forEach(q => {
      this.usedQuestions.add(q.id);
      console.log('[QuestionService] Marked question as used:', q.id);
    });
    this.saveUsedQuestions();

    console.log('[QuestionService] Final selection:', selectedQuestions.length, 'questions');
    console.log('[QuestionService] New used questions count:', this.usedQuestions.size);
    return selectedQuestions;
  }

  resetUsedQuestions(): void {
    console.log('[QuestionService] Resetting used questions pool');
    this.usedQuestions.clear();
    this.saveUsedQuestions();
  }

  getUsedQuestionsCount(): number {
    return this.usedQuestions.size;
  }
}

// Export singleton instance
export const questionService = QuestionService.getInstance();
