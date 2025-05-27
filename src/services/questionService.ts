
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
      }
    } catch (error) {
      console.error('[QuestionService] Error loading used questions:', error);
      this.usedQuestions = new Set();
    }
  }

  private saveUsedQuestions(): void {
    try {
      localStorage.setItem(USED_QUESTIONS_KEY, JSON.stringify([...this.usedQuestions]));
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

    console.log('[QuestionService] Fetched', data?.length || 0, 'questions');
    return data || [];
  }

  selectQuestionsForRound(availableQuestions: TriviaQuestion[]): TriviaQuestion[] {
    console.log('[QuestionService] Selecting questions for round from', availableQuestions.length, 'available');
    
    const selectedQuestions: TriviaQuestion[] = [];
    const categoriesUsed = new Set<string>();

    // Group questions by category
    const questionsByCategory = CATEGORIES.reduce((acc, category) => {
      acc[category] = availableQuestions.filter(q => 
        q.category === category && !this.usedQuestions.has(q.id)
      );
      return acc;
    }, {} as Record<QuestionCategory, TriviaQuestion[]>);

    // Select one question from each category
    for (const category of CATEGORIES) {
      const categoryQuestions = questionsByCategory[category];
      
      if (categoryQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
        const selectedQuestion = categoryQuestions[randomIndex];
        selectedQuestions.push(selectedQuestion);
        categoriesUsed.add(category);
        
        console.log('[QuestionService] Selected question from category', category, ':', selectedQuestion.id);
      } else {
        console.warn('[QuestionService] No unused questions available for category:', category);
      }
    }

    // If we couldn't get 7 questions, we might need to reset the used questions pool
    if (selectedQuestions.length < 7) {
      console.warn('[QuestionService] Only found', selectedQuestions.length, 'questions, may need to reset used pool');
      
      // If we have less than 7 questions total, reset used questions and try again
      if (selectedQuestions.length < 3) {
        console.log('[QuestionService] Resetting used questions pool');
        this.resetUsedQuestions();
        return this.selectQuestionsForRound(availableQuestions);
      }
    }

    // Mark selected questions as used
    selectedQuestions.forEach(q => {
      this.usedQuestions.add(q.id);
    });
    this.saveUsedQuestions();

    console.log('[QuestionService] Selected', selectedQuestions.length, 'questions for round');
    return selectedQuestions;
  }

  resetUsedQuestions(): void {
    console.log('[QuestionService] Resetting used questions');
    this.usedQuestions.clear();
    this.saveUsedQuestions();
  }

  getUsedQuestionsCount(): number {
    return this.usedQuestions.size;
  }
}

// Export singleton instance
export const questionService = QuestionService.getInstance();
