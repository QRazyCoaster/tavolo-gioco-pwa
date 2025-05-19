
// If this file doesn't exist, it will be created
// Update this to make sure MAX_ROUNDS is properly exported

export const QUESTION_TIMER = 90; // 90 seconds per question
export const QUESTIONS_PER_ROUND = 7; // 7 questions per round (changed from 1)
export const MAX_ROUNDS = 3; // 3 rounds maximum
export const MIN_SCORE_LIMIT = -420; // Minimum score limit for players (-420 to allow for maximum of 84 wrong answers)
export const CORRECT_ANSWER_POINTS = 5; // Points for correct answers
export const WRONG_ANSWER_POINTS = -5; // Points deduction for wrong answers

// Add mock questions here if they don't exist elsewhere
export const mockQuestions = [
  {
    id: '1',
    textEn: 'What is the capital of France?',
    textIt: "Qual è la capitale della Francia?",
    answerEn: 'Paris',
    answerIt: 'Parigi',
    categoryId: 'geography', 
    difficulty: 'easy' as 'easy' | 'medium' | 'hard' // Type assertion to match the TriviaQuestion type
  },
  {
    id: '2',
    textEn: 'Which planet is known as the Red Planet?',
    textIt: 'Quale pianeta è conosciuto come il Pianeta Rosso?',
    answerEn: 'Mars',
    answerIt: 'Marte',
    categoryId: 'astronomy',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard'
  },
  {
    id: '3',
    textEn: 'Who painted the Mona Lisa?',
    textIt: 'Chi ha dipinto la Gioconda?',
    answerEn: 'Leonardo da Vinci',
    answerIt: 'Leonardo da Vinci',
    categoryId: 'art',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard'
  },
  {
    id: '4',
    textEn: 'What is the largest ocean on Earth?',
    textIt: 'Qual è l\'oceano più grande della Terra?',
    answerEn: 'Pacific Ocean',
    answerIt: 'Oceano Pacifico',
    categoryId: 'geography',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  },
  {
    id: '5',
    textEn: 'What is the chemical symbol for gold?',
    textIt: 'Qual è il simbolo chimico dell\'oro?',
    answerEn: 'Au',
    answerIt: 'Au',
    categoryId: 'science',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  },
  {
    id: '6',
    textEn: 'Which country is known as the Land of the Rising Sun?',
    textIt: 'Quale paese è conosciuto come la Terra del Sol Levante?',
    answerEn: 'Japan',
    answerIt: 'Giappone',
    categoryId: 'geography',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  },
  {
    id: '7',
    textEn: 'What is the largest mammal in the world?',
    textIt: 'Qual è il mammifero più grande del mondo?',
    answerEn: 'Blue whale',
    answerIt: 'Balenottera azzurra',
    categoryId: 'biology',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  },
  {
    id: '8',
    textEn: 'How many sides does a hexagon have?',
    textIt: 'Quanti lati ha un esagono?',
    answerEn: 'Six',
    answerIt: 'Sei',
    categoryId: 'mathematics',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard'
  },
  {
    id: '9',
    textEn: 'What is the capital of Japan?',
    textIt: 'Qual è la capitale del Giappone?',
    answerEn: 'Tokyo',
    answerIt: 'Tokyo',
    categoryId: 'geography',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard'
  },
  {
    id: '10',
    textEn: 'Who wrote "Romeo and Juliet"?',
    textIt: 'Chi ha scritto "Romeo e Giulietta"?',
    answerEn: 'William Shakespeare',
    answerIt: 'William Shakespeare',
    categoryId: 'literature',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard'
  }
];
