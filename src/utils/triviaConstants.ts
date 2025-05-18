
/* ── game-tuning constants ───────────────────────────────────────── */

export const QUESTIONS_PER_ROUND   = 7;
export const QUESTION_TIMER        = 90;   // seconds  ← CORRECT VALUE
export const CORRECT_ANSWER_POINTS = 10;
export const WRONG_ANSWER_POINTS   = -5;
export const MIN_SCORE_LIMIT       = -420; // keep your preferred floor
export const MAX_ROUNDS            = 3;    // maximum number of rounds in a game

/* ── local mock questions (unchanged) ───────────────────────────── */

export const mockQuestions = [
  {
    id: '1',
    textEn: 'What is the capital of Italy?',
    textIt: "Qual è la capitale d'Italia?",
    categoryId: 'geography',
    answerEn: 'Rome',
    answerIt: 'Roma',
    difficulty: 'easy' as const
  },
  /* … the rest of your 2-7 questions exactly as before … */
];
