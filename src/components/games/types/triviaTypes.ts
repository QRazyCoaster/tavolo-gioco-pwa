
import { Player } from '@/context/GameContext';

// Extracted question type
export interface TriviaQuestionType {
  id: string;
  textEn: string;
  textIt: string;
  answerEn: string;
  answerIt: string;
  options?: string[];
}

export interface TriviaGameState {
  questions: TriviaQuestionType[];
  currentQuestionIndex: number;
  showAnswer: boolean;
  roundNumber: number;
  waitingForNarrator: boolean;
  queuedPlayers: Player[];
  isCurrentNarrator: boolean;
  currentQuestion: TriviaQuestionType;
  sortedPlayers: Player[];
}
