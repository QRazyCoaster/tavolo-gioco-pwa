
export interface Category {
  id: string;
  nameEn: string;
  nameIt: string;
}

export interface TriviaQuestion {
  id: string;
  language: 'en' | 'it';
  category: string;
  question: string;
  correct_answer: string;
  created_at?: string;
}

export interface PlayerAnswer {
  playerId: string;
  playerName: string;
  timestamp: number;
}

export interface Round {
  roundNumber: number;
  narratorId: string;
  questions: TriviaQuestion[];
  currentQuestionIndex: number;
  playerAnswers: PlayerAnswer[];
  timeLeft: number;
}
