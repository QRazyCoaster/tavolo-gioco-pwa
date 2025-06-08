// src/services/questionService.ts

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

  /** Fetch all questions for the given language, regardless of total size */
  async fetchQuestionsByLanguage(language: 'en' | 'it'): Promise<TriviaQuestion[]> {
    console.log('[QuestionService] Fetching questions for language:', language);

    // 1) Initial fetch, also ask supabase for exact count
    const { data: firstBatch, count, error: countErr } = await supabase
      .from<TriviaQuestion>('trivia_questions')
      .select('*', { count: 'exact' })
      .eq('language', language);

    if (countErr) {
      console.error('[QuestionService] Error fetching count:', countErr);
      throw countErr;
    }
    const total = count ?? 0;
    console.log(`[QuestionService] Total questions in DB: ${total}`);
    console.log(`[QuestionService] Fetched first batch length: ${firstBatch?.length ?? 0}`);

    // 2) If there are more rows than the first batch, fetch them all
    if (firstBatch && total > firstBatch.length) {
      const { data: allData, error: fetchErr } = await supabase
        .from<TriviaQuestion>('trivia_questions')
        .select('*')
        .eq('language', language)
        .range(0, total - 1);

      if (fetchErr) {
        console.error('[QuestionService] Error fetching full set:', fetchErr);
        throw fetchErr;
      }
      console.log(`[QuestionService] Fetched full set: ${allData?.length ?? 0} rows`);
      return allData || [];
    }

    return firstBatch || [];
  }

  selectQuestionsForRound(availableQuestions: TriviaQuestion[]): TriviaQuestion[] {
    console.log('===============================');
    console.log('[QuestionService] Starting question selection for game:', this.currentGameId);
    console.log('[QuestionService] Available questions:', availableQuestions.length);
    console.log('[QuestionService] Used questions count:', this.usedQuestions.size);
    console.log('[QuestionService] Expected categories:', CATEGORIES);

    // Determine which categories actually exist
    const categoriesInDatabase = new Set(availableQuestions.map(q => q.category));
    console.log('[QuestionService] Categories found in database:', [...categoriesInDatabase]);

    const missingCategories = CATEGORIES.filter(cat => !categoriesInDatabase.has(cat));
    if (missingCategories.length) {
      console.error('[QuestionService] ❌ MISSING CATEGORIES in database:', missingCategories);
    }

    // Group by category, excluding used
    const questionsByCategory = CATEGORIES.reduce((acc, category) => {
      const categoryQuestions = availableQuestions.filter(q =>
        q.category === category && !this.usedQuestions.has(q.id)
      );
      acc[category] = categoryQuestions;

      // Debug drinks
      if (category === 'drinks') {
        console.log(`🍺 DRINKS category: total=${availableQuestions.filter(q => q.category === 'drinks').length}, unused=${categoryQuestions.length}`);
      }
      console.log(`[QuestionService] Category ${category}: ${categoryQuestions.length} unused / ${availableQuestions.filter(q => q.category === category).length} total`);
      return acc;
    }, {} as Record<QuestionCategory, TriviaQuestion[]>);

    // If any category has no unused questions, reset pool
    const availableCats = CATEGORIES.filter(cat => questionsByCategory[cat].length > 0);
    if (availableCats.length < CATEGORIES.length) {
      console.warn('[QuestionService] ⚠️ Cannot select one per category, resetting used pool');
      this.resetUsedQuestions();
      CATEGORIES.forEach(cat => {
        questionsByCategory[cat] = availableQuestions.filter(q => q.category === cat);
        console.log(`[QuestionService] After reset - Category ${cat}: ${questionsByCategory[cat].length} questions`);
      });
    }

    // Now pick one random per category
    const selected: TriviaQuestion[] = [];
    for (const cat of CATEGORIES) {
      const pool = questionsByCategory[cat];
      if (pool.length) {
        const pick = pool[Math.floor(Math.random() * pool.length)];
        selected.push(pick);
        console.log(`[QuestionService] ✅ Selected from ${cat}: ${pick.id}`);
      } else {
        console.error(`[QuestionService] ❌ No questions for category ${cat}`);
      }
    }

    // Validate count
    if (selected.length !== CATEGORIES.length) {
      console.error(`[QuestionService] ❌ Expected ${CATEGORIES.length} questions, got ${selected.length}`);
    } else {
      console.log('[QuestionService] ✅ Successfully selected all categories');
    }

    // Mark used
    selected.forEach(q => this.usedQuestions.add(q.id));
    this.saveUsedQuestions();

    return selected;
  }

  resetUsedQuestions(): void {
    console.log('[QuestionService] Resetting used questions pool for game:', this.currentGameId);
    this.usedQuestions.clear();
    this.saveUsedQuestions();
  }

  clearGameData(gameId: string): void {
    console.log('[QuestionService] Clearing data for game:', gameId);
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

// Export singleton
export const questionService = QuestionService.getInstance();
