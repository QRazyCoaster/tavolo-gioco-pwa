
import { supabase } from '@/supabaseClient';
import { TriviaQuestion } from '@/types/trivia';
import { CATEGORIES, type QuestionCategory } from '@/utils/questionConstants';

const USED_QUESTIONS_KEY = 'trivia_used_questions';

export class QuestionService {
  private static instance: QuestionService;
  private usedQuestions: Set<string> = new Set();
  private currentGameId: string | null = null;

  private constructor() {
    // Don't load used questions on construction - wait for game ID
  }

  static getInstance(): QuestionService {
    if (!QuestionService.instance) {
      QuestionService.instance = new QuestionService();
    }
    return QuestionService.instance;
  }

  private getUsedQuestionsKey(gameId: string): string {
    return `${USED_QUESTIONS_KEY}_${gameId}`;
  }

  private loadUsedQuestions(gameId: string): void {
    try {
      const key = this.getUsedQuestionsKey(gameId);
      const stored = localStorage.getItem(key);
      if (stored) {
        this.usedQuestions = new Set(JSON.parse(stored));
        console.log('[QuestionService] Loaded', this.usedQuestions.size, 'used questions for game', gameId);
      } else {
        this.usedQuestions = new Set();
        console.log('[QuestionService] No used questions found for game', gameId, '- starting fresh');
      }
    } catch (error) {
      console.error('[QuestionService] Error loading used questions:', error);
      this.usedQuestions = new Set();
    }
  }

  private saveUsedQuestions(): void {
    if (!this.currentGameId) return;
    
    try {
      const key = this.getUsedQuestionsKey(this.currentGameId);
      localStorage.setItem(key, JSON.stringify([...this.usedQuestions]));
      console.log('[QuestionService] Saved', this.usedQuestions.size, 'used questions for game', this.currentGameId);
    } catch (error) {
      console.error('[QuestionService] Error saving used questions:', error);
    }
  }

  setGameId(gameId: string): void {
    if (this.currentGameId !== gameId) {
      console.log('[QuestionService] Switching to game:', gameId);
      this.currentGameId = gameId;
      this.loadUsedQuestions(gameId);
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
    console.log('[QuestionService] ===============================');
    console.log('[QuestionService] Starting question selection for game:', this.currentGameId);
    console.log('[QuestionService] Available questions:', availableQuestions.length);
    console.log('[QuestionService] Used questions count:', this.usedQuestions.size);
    console.log('[QuestionService] Expected categories:', CATEGORIES);
    
    const selectedQuestions: TriviaQuestion[] = [];

    // First, let's see what categories are actually in the database
    const categoriesInDatabase = new Set(availableQuestions.map(q => q.category));
    console.log('[QuestionService] Categories found in database:', [...categoriesInDatabase]);
    
    // Check for missing categories
    const missingCategories = CATEGORIES.filter(cat => !categoriesInDatabase.has(cat));
    if (missingCategories.length > 0) {
      console.error('[QuestionService] ❌ MISSING CATEGORIES in database:', missingCategories);
    }

    // Group questions by category, excluding already used ones
    const questionsByCategory = CATEGORIES.reduce((acc, category) => {
      const categoryQuestions = availableQuestions.filter(q => 
        q.category === category && !this.usedQuestions.has(q.id)
      );
      acc[category] = categoryQuestions;
      
      // Special attention to drinks category
      if (category === 'drinks') {
        console.log(`[QuestionService] 🍺 DRINKS category detailed analysis:`);
        console.log(`[QuestionService] 🍺 Total drinks in database: ${availableQuestions.filter(q => q.category === 'drinks').length}`);
        console.log(`[QuestionService] 🍺 Used drinks: ${[...this.usedQuestions].filter(id => availableQuestions.find(q => q.id === id)?.category === 'drinks').length}`);
        console.log(`[QuestionService] 🍺 Available unused drinks: ${categoryQuestions.length}`);
        if (categoryQuestions.length > 0) {
          console.log(`[QuestionService] 🍺 First few available drinks:`, categoryQuestions.slice(0, 3).map(q => ({ id: q.id, question: q.question.substring(0, 30) + '...' })));
        }
      }
      
      console.log(`[QuestionService] Category ${category}: ${categoryQuestions.length} unused questions (${availableQuestions.filter(q => q.category === category).length} total)`);
      return acc;
    }, {} as Record<QuestionCategory, TriviaQuestion[]>);

    // Check if we can select one question from each category
    const categoriesWithQuestions = CATEGORIES.filter(category => questionsByCategory[category].length > 0);
    console.log('[QuestionService] Categories with unused questions:', categoriesWithQuestions.length, 'out of', CATEGORIES.length);
    
    if (categoriesWithQuestions.length < CATEGORIES.length) {
      console.warn('[QuestionService] ⚠️ Cannot select one question per category, resetting used questions pool');
      const missingCats = CATEGORIES.filter(category => questionsByCategory[category].length === 0);
      console.log('[QuestionService] ⚠️ Categories with no unused questions:', missingCats);
      
      this.resetUsedQuestions();
      
      // Rebuild the groups without used questions filter
      CATEGORIES.forEach(category => {
        questionsByCategory[category] = availableQuestions.filter(q => q.category === category);
        console.log(`[QuestionService] After reset - Category ${category}: ${questionsByCategory[category].length} questions`);
      });
    }

    // Select one random question from each category
    console.log('[QuestionService] Starting selection process...');
    for (const category of CATEGORIES) {
      const categoryQuestions = questionsByCategory[category];
      
      if (categoryQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
        const selectedQuestion = categoryQuestions[randomIndex];
        selectedQuestions.push(selectedQuestion);
        
        console.log(`[QuestionService] ✅ Selected from ${category} (${selectedQuestions.length}/7):`, selectedQuestion.id, '-', selectedQuestion.question.substring(0, 50) + '...');
      } else {
        console.error(`[QuestionService] ❌ No questions available for category: ${category}`);
        console.error(`[QuestionService] ❌ This will cause the 7th question to be undefined!`);
      }
    }

    // Validation: Ensure we have exactly 7 questions
    if (selectedQuestions.length !== 7) {
      console.error('[QuestionService] ❌ CRITICAL ERROR: Expected 7 questions, got:', selectedQuestions.length);
      console.error('[QuestionService] ❌ Selected questions by category:', selectedQuestions.map(q => ({ category: q.category, id: q.id })));
      console.error('[QuestionService] ❌ This WILL cause the "Loading question..." bug!');
    } else {
      console.log('[QuestionService] ✅ Successfully selected exactly 7 questions');
    }

    // Mark selected questions as used
    selectedQuestions.forEach((q, index) => {
      this.usedQuestions.add(q.id);
      console.log(`[QuestionService] Marked question ${index + 1}/7 as used: ${q.id} (${q.category})`);
    });
    this.saveUsedQuestions();

    console.log('[QuestionService] Final selection summary:');
    console.log('[QuestionService] - Selected questions:', selectedQuestions.length);
    console.log('[QuestionService] - Categories covered:', selectedQuestions.map(q => q.category));
    console.log('[QuestionService] - New used questions count:', this.usedQuestions.size);
    console.log('[QuestionService] ===============================');
    
    return selectedQuestions;
  }

  resetUsedQuestions(): void {
    console.log('[QuestionService] Resetting used questions pool for game:', this.currentGameId);
    this.usedQuestions.clear();
    this.saveUsedQuestions();
  }

  clearGameData(gameId: string): void {
    console.log('[QuestionService] Clearing all data for game:', gameId);
    const key = this.getUsedQuestionsKey(gameId);
    localStorage.removeItem(key);
    if (this.currentGameId === gameId) {
      this.usedQuestions.clear();
    }
  }

  getUsedQuestionsCount(): number {
    return this.usedQuestions.size;
  }
}

// Export singleton instance
export const questionService = QuestionService.getInstance();
