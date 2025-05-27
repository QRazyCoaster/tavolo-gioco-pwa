
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
    console.log('[QuestionService] Currently used questions:', this.usedQuestions.size);
    
    const selectedQuestions: TriviaQuestion[] = [];

    // Group questions by category, excluding already used ones
    const questionsByCategory = CATEGORIES.reduce((acc, category) => {
      acc[category] = availableQuestions.filter(q => 
        q.category === category && !this.usedQuestions.has(q.id)
      );
      return acc;
    }, {} as Record<QuestionCategory, TriviaQuestion[]>);

    // Log available questions per category
    CATEGORIES.forEach(category => {
      console.log(`[QuestionService] Category ${category}: ${questionsByCategory[category].length} unused questions`);
    });

    // Check if we need to reset used questions
    const totalAvailableUnused = Object.values(questionsByCategory).reduce((sum, questions) => sum + questions.length, 0);
    
    if (totalAvailableUnused < 7) {
      console.log('[QuestionService] Not enough unused questions, resetting used questions pool');
      this.resetUsedQuestions();
      
      // Rebuild the groups without used questions filter
      CATEGORIES.forEach(category => {
        questionsByCategory[category] = availableQuestions.filter(q => q.category === category);
      });
    }

    // Select one random question from each category
    for (const category of CATEGORIES) {
      const categoryQuestions = questionsByCategory[category];
      
      if (categoryQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
        const selectedQuestion = categoryQuestions[randomIndex];
        selectedQuestions.push(selectedQuestion);
        
        console.log('[QuestionService] Selected question from category', category, ':', selectedQuestion.id);
      } else {
        console.warn('[QuestionService] No questions available for category:', category);
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
