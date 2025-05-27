
// ─────────────────────────────────────────────────────────────
//  Game constants
// ─────────────────────────────────────────────────────────────
export const QUESTION_TIMER = 90;
export const QUESTIONS_PER_ROUND = 7;
export const MIN_SCORE_LIMIT = -420;
export const CORRECT_ANSWER_POINTS = 10;
export const WRONG_ANSWER_POINTS = -5;

// ─────────────────────────────────────────────────────────────
//  Fallback questions matching database schema
// ─────────────────────────────────────────────────────────────
export const mockQuestions = [
  { id: 'fallback-1', language: 'en' as const, category: 'geo_his', question: 'What is the capital of France?', correct_answer: 'Paris' },
  { id: 'fallback-2', language: 'en' as const, category: 'show_biz', question: 'Who directed the movie "Jaws"?', correct_answer: 'Steven Spielberg' },
  { id: 'fallback-3', language: 'en' as const, category: 'riddles', question: 'What gets wetter as it dries?', correct_answer: 'A towel' },
  { id: 'fallback-4', language: 'en' as const, category: 'sports', question: 'How many players are on a basketball team on the court?', correct_answer: '5' },
  { id: 'fallback-5', language: 'en' as const, category: 'tech_sci', question: 'What does "WWW" stand for?', correct_answer: 'World Wide Web' },
  { id: 'fallback-6', language: 'en' as const, category: 'drinks', question: 'What is the main ingredient in beer?', correct_answer: 'Hops and barley' },
  { id: 'fallback-7', language: 'en' as const, category: 'math', question: 'What is 15% of 200?', correct_answer: '30' },
];

export const mockQuestionsItalian = [
  { id: 'fallback-it-1', language: 'it' as const, category: 'geo_his', question: 'Qual è la capitale della Francia?', correct_answer: 'Parigi' },
  { id: 'fallback-it-2', language: 'it' as const, category: 'show_biz', question: 'Chi ha diretto il film "Lo Squalo"?', correct_answer: 'Steven Spielberg' },
  { id: 'fallback-it-3', language: 'it' as const, category: 'riddles', question: 'Cosa diventa più bagnato mentre asciuga?', correct_answer: 'Un asciugamano' },
  { id: 'fallback-it-4', language: 'it' as const, category: 'sports', question: 'Quanti giocatori ci sono in campo per squadra nel basket?', correct_answer: '5' },
  { id: 'fallback-it-5', language: 'it' as const, category: 'tech_sci', question: 'Cosa significa "WWW"?', correct_answer: 'World Wide Web' },
  { id: 'fallback-it-6', language: 'it' as const, category: 'drinks', question: 'Qual è l\'ingrediente principale della birra?', correct_answer: 'Luppolo e orzo' },
  { id: 'fallback-it-7', language: 'it' as const, category: 'math', question: 'Quanto è il 15% di 200?', correct_answer: '30' },
];
