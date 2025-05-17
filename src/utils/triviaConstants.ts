
export const QUESTIONS_PER_ROUND   = 7;
export const QUESTION_TIMER        = 90;   // seconds  ← restored
export const CORRECT_ANSWER_POINTS = 10;   // ← restored
export const WRONG_ANSWER_POINTS   = -5;
export const MIN_SCORE_LIMIT       = -420; // keep your preferred floor
export const mockQuestions = [
  { 
    id: '1', 
    textEn: 'What is the capital of Italy?', 
    textIt: 'Qual è la capitale d\'Italia?',
    categoryId: 'geography',
    answerEn: 'Rome',
    answerIt: 'Roma',
    difficulty: 'easy' as const
  },
  { 
    id: '2', 
    textEn: 'Which planet is known as the Red Planet?', 
    textIt: 'Quale pianeta è conosciuto come il Pianeta Rosso?',
    categoryId: 'science',
    answerEn: 'Mars',
    answerIt: 'Marte',
    difficulty: 'easy' as const
  },
  { 
    id: '3', 
    textEn: 'Who painted the Mona Lisa?', 
    textIt: 'Chi ha dipinto la Monna Lisa?',
    categoryId: 'art',
    answerEn: 'Leonardo da Vinci',
    answerIt: 'Leonardo da Vinci',
    difficulty: 'easy' as const
  },
  { 
    id: '4', 
    textEn: 'What is the largest ocean on Earth?', 
    textIt: 'Qual è l\'oceano più grande della Terra?',
    categoryId: 'geography',
    answerEn: 'Pacific Ocean',
    answerIt: 'Oceano Pacifico',
    difficulty: 'medium' as const
  },
  { 
    id: '5', 
    textEn: 'Which country is known as the Land of the Rising Sun?', 
    textIt: 'Quale paese è conosciuto come la Terra del Sol Levante?',
    categoryId: 'geography',
    answerEn: 'Japan',
    answerIt: 'Giappone',
    difficulty: 'medium' as const
  },
  { 
    id: '6', 
    textEn: 'Which element has the chemical symbol "O"?', 
    textIt: 'Quale elemento ha il simbolo chimico "O"?',
    categoryId: 'science',
    answerEn: 'Oxygen',
    answerIt: 'Ossigeno',
    difficulty: 'easy' as const
  },
  { 
    id: '7', 
    textEn: 'What is the largest mammal in the world?', 
    textIt: 'Qual è il mammifero più grande del mondo?',
    categoryId: 'science',
    answerEn: 'Blue Whale',
    answerIt: 'Balenottera Azzurra',
    difficulty: 'medium' as const
  },
];

// Minimum score limit (prevent scores from going below this value)
export const MIN_SCORE_LIMIT = -420;
