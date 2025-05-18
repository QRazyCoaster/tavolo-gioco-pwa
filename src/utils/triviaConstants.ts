
// ─────────────────────────────────────────────────────────────
//  Game constants
// ─────────────────────────────────────────────────────────────
export const QUESTION_TIMER = 90;
export const QUESTIONS_PER_ROUND = 7;
export const MIN_SCORE_LIMIT = -420; // New constant for minimum score
export const CORRECT_ANSWER_POINTS = 10;
export const WRONG_ANSWER_POINTS = -5;

// ─────────────────────────────────────────────────────────────
//  Demo questions
// ─────────────────────────────────────────────────────────────
export const mockQuestions = [
  { id: '1', textEn: 'What is the capital of France?', textIt: 'Qual è la capitale della Francia?', answerEn: 'Paris', answerIt: 'Parigi', categoryId: 'geography', difficulty: 'easy' as const },
  { id: '2', textEn: 'Who painted the Mona Lisa?', textIt: 'Chi ha dipinto la Monna Lisa?', answerEn: 'Leonardo da Vinci', answerIt: 'Leonardo da Vinci', categoryId: 'art', difficulty: 'easy' as const },
  { id: '3', textEn: 'What is the chemical symbol for water?', textIt: "Qual è il simbolo chimico dell'acqua?", answerEn: 'H2O', answerIt: 'H2O', categoryId: 'science', difficulty: 'easy' as const },
  { id: '4', textEn: 'What planet is known as the Red Planet?', textIt: 'Quale pianeta è conosciuto come il Pianeta Rosso?', answerEn: 'Mars', answerIt: 'Marte', categoryId: 'astronomy', difficulty: 'easy' as const },
  { id: '5', textEn: 'Who wrote "Romeo and Juliet"?', textIt: 'Chi ha scritto "Romeo e Giulietta"?', answerEn: 'William Shakespeare', answerIt: 'William Shakespeare', categoryId: 'literature', difficulty: 'easy' as const },
  {
    id: '6',
    textEn: 'In what year did the Titanic sink?',
    textIt: 'In che anno affondò il Titanic?',
    answerEn: '1912',
    answerIt: '1912',
    categoryId: 'history',
    difficulty: 'easy' as const
  },
  {
    id: '7',
    textEn: 'Which gas do plants absorb from the atmosphere?',
    textIt: 'Quale gas assorbono le piante dall\'atmosfera?',
    answerEn: 'Carbon dioxide',
    answerIt: 'Anidride carbonica',
    categoryId: 'science',
    difficulty: 'easy' as const
  },
  {
    id: '8',
    textEn: 'Am i getting good or not? aha',
    textIt: 'Am i getting good or not? aha?',
    answerEn: 'Yeye',
    answerIt: 'yeye',
    categoryId: 'history',
    difficulty: 'easy' as const
  },
];
