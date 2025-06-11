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
      } else {
        this.usedQuestions = new Set();
      }
    } catch (error) {
      this.usedQuestions = new Set();
    }
  }

  private saveUsedQuestions(): void {
    if (!this.currentGameId) return;
    try {
      const key = this.getUsedQuestionsKey(this.currentGameId);
      localStorage.setItem(key, JSON.stringify([...this.usedQuestions]));
    } catch (error) {
      // Silently handle storage errors
    }
  }

  setGameId(gameId: string): void {
    if (this.currentGameId !== gameId) {
      this.currentGameId = gameId;
      this.loadUsedQuestions(gameId);
    }
  }

  async fetchQuestionsByLanguage(language: 'en' | 'it'): Promise<TriviaQuestion[]> {
    const { data: allData, error: fetchErr } = await supabase
      .from('trivia_questions')
      .select('*')
      .eq('language', language)
      .limit(5000)
      .order('id');

    if (fetchErr) {
      throw fetchErr;
    }

    return allData || [];
  }

  selectQuestionsForRound(availableQuestions: TriviaQuestion[]): TriviaQuestion[] {
    const questionsByCategory = CATEGORIES.reduce((acc, category) => {
      const categoryQuestions = availableQuestions.filter(q =>
        q.category === category && !this.usedQuestions.has(q.id)
      );
      acc[category] = categoryQuestions;
      return acc;
    }, {} as Record<QuestionCategory, TriviaQuestion[]>);

    // If any category has no unused questions, reset pool
    const availableCats = CATEGORIES.filter(cat => questionsByCategory[cat].length > 0);
    if (availableCats.length < CATEGORIES.length) {
      this.resetUsedQuestions();
      CATEGORIES.forEach(cat => {
        questionsByCategory[cat] = availableQuestions.filter(q => q.category === cat);
      });
    }

    // Now pick one random per category
    const selected: TriviaQuestion[] = [];
    for (const cat of CATEGORIES) {
      const pool = questionsByCategory[cat];
      if (pool.length) {
        const pick = pool[Math.floor(Math.random() * pool.length)];
        selected.push(pick);
      }
    }


    // Mark used
    selected.forEach(q => this.usedQuestions.add(q.id));
    this.saveUsedQuestions();

    return selected;
  }

  resetUsedQuestions(): void {
    this.usedQuestions.clear();
    this.saveUsedQuestions();
  }

  clearGameData(gameId: string): void {
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
