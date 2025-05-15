
export interface Category {
  id: string;
  nameEn: string;
  nameIt: string;
}

export interface TriviaQuestion {
  id: string;
  categoryId: string;
  textEn: string;
  textIt: string;
  answerEn: string;
  answerIt: string;
  options?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
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
