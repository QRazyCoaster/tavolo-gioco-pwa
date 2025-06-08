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
    // Don’t load used questions until gameId is set
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

  /**
   * Fetch *all* trivia_questions for the given language,
   * without ever hitting a hard-coded row limit.
   */
  async fetchQuestionsByLanguage(language: 'en' | 'it'): Promise<TriviaQuestion[]> {
    console.log('[QuestionService] Fetching questions for language:', language);

    // 1) Fetch first page and get exact count
    const { data: firstBatch, count, error: countErr } = await supabase
      .from<TriviaQuestion>('trivia_questions')
      .select('*', { count: 'exact' })
      .eq('language', language);

    if (countErr) {
      console.error('[QuestionService] Error fetching question count:', countErr);
      throw countErr;
    }

    const total = count ?? (firstBatch?.length ?? 0);
    console.log(`[QuestionService] Total questions in DB: ${total}`);

    // 2) If DB has more rows than the first batch, fetch them all
    if (firstBatch && total > firstBatch.length) {
      const { data: allData, error: fetchErr } = await supabase
        .from<TriviaQuestion>('trivia_questions')
        .select('*')
        .eq('language', language)
        .range(0, total - 1);

      if (fetchErr) {
        console.error('[QuestionService] Error fetching all rows:', fetchErr);
        throw fetchErr;
      }
      console.log(`[QuestionService] Fetched full set of ${allData.length} rows`);
      return allData;
    }

    // 3) Otherwise, we already have them all
    console.log(`[QuestionService] Fetched ${firstBatch?.length ?? 0} rows (all available)`);
    return firstBatch || [];
  }

  selectQuestionsForRound(availableQuestions: TriviaQuestion[]): TriviaQuestion[] {
    console.log('[QuestionService] ===============================');
    console.log('[QuestionService] Starting question selection for game:', this.currentGameId);
    console.log('[QuestionService] Available questions:', availableQuestions.length);
    console.log('[QuestionService] Used questions count:', this.usedQuestions.size);
    console.log('[QuestionService] Expected categories:', CATEGORIES);

    // 1) See what categories actually exist
    const categoriesInDatabase = new Set(availableQuestions.map(q => q.category as QuestionCategory));
    console.log('[QuestionService] Categories found in database:', [...categoriesInDatabase]);

    // 2) Check missing
    const missingCategories = CATEGORIES.filter(cat => !categoriesInDatabase.has(cat));
    if (missingCategories.length > 0) {
      console.error('[QuestionService] ❌ MISSING CATEGORIES in database:', missingCategories);
    }

    // 3) Group by category, filtering out used questions
    const questionsByCategory = CATEGORIES.reduce((acc, category) => {
      const categoryQuestions = availableQuestions.filter(q =>
        q.category === category && !this.usedQuestions.has(q.id)
      );
      acc[category] = categoryQuestions;

      // Debug “drinks”
      if (category === 'drinks') {
        console.log(`[QuestionService] 🍺 DRINKS category detailed analysis:`);
        console.log(`  Total drinks in DB: ${availableQuestions.filter(q => q.category === 'drinks').length}`);
        console.log(`  Used drinks: ${[...this.usedQuestions].filter(id =>
          availableQuestions.find(q => q.id === id)?.category === 'drinks'
        ).length}`);
        console.log(`  Unused drinks: ${categoryQuestions.length}`);
        if (categoryQuestions.length) {
          console.log(`  Sample:`,
            categoryQuestions.slice(0,3).map(q => ({ id: q.id, text: q.question?.slice(0,30) + '...' }))
          );
        }
      }

      console.log(`[QuestionService] Category ${category}: ${categoryQuestions.length} unused (${availableQuestions.filter(q => q.category === category).length} total)`);
      return acc;
    }, {} as Record<QuestionCategory, TriviaQuestion[]>);

    // 4) If any category is empty, reset used pool
    const availableCats = CATEGORIES.filter(cat => questionsByCategory[cat].length > 0);
    if (availableCats.length < CATEGORIES.length) {
      console.warn('[QuestionService] ⚠️ Cannot select one per category, resetting used questions pool');
      const empty = CATEGORIES.filter(cat => questionsByCategory[cat].length === 0);
      console.log('[QuestionService] ⚠️ Categories with no unused questions:', empty);
      this.resetUsedQuestions();

      // rebuild groups without used‐filter
      CATEGORIES.forEach(cat => {
        questionsByCategory[cat] = availableQuestions.filter(q => q.category === cat);
        console.log(`[QuestionService] After reset - Category ${cat}: ${questionsByCategory[cat].length} questions`);
      });
    }

    // 5) Pick one random per category
    const selected: TriviaQuestion[] = [];
    for (const category of CATEGORIES) {
      const bucket = questionsByCategory[category];
      if (bucket.length) {
        const pick = bucket[Math.floor(Math.random()*bucket.length)];
        selected.push(pick);
        console.log(`[QuestionService] ✅ Selected from ${category} (${selected.length}/${CATEGORIES.length}):`, pick.id);
      } else {
        console.error(`[QuestionService] ❌ No questions available for category: ${category}`);
      }
    }

    // 6) Warn if not full set
    if (selected.length !== CATEGORIES.length) {
      console.error('[QuestionService] ❌ CRITICAL: Expected', CATEGORIES.length, 'questions but got', selected.length);
    } else {
      console.log('[QuestionService] ✅ Selected exactly', selected.length, 'questions');
    }

    // 7) Mark as used
    selected.forEach((q,i) => {
      this.usedQuestions.add(q.id);
      console.log(`[QuestionService] Marked question ${i+1}/${selected.length} as used:`, q.id);
    });
    this.saveUsedQuestions();

    console.log('[QuestionService] ===============================');
    return selected;
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

// singleton export
export const questionService = QuestionService.getInstance();
