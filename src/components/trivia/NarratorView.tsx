// src/components/trivia/NarratorView.tsx

import React, { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Player } from '@/context/GameContext';
import { TriviaQuestion, PlayerAnswer } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import QuestionCard from './QuestionCard';
import QuestionInfo from './QuestionInfo';
import PlayerRankings from './PlayerRankings';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface NarratorViewProps {
  currentQuestion: TriviaQuestion;
  roundNumber: number;
  questionNumber: number;
  totalQuestions: number;
  players: Player[];
  playerAnswers: PlayerAnswer[];
  onCorrectAnswer?: (playerId: string) => void;
  onWrongAnswer?: (playerId: string) => void;
  onNextQuestion: () => void;
  timeLeft: number;
  showPendingAnswers: boolean;
  setShowPendingAnswers: (show: boolean) => void;
}

const NarratorView: React.FC<NarratorViewProps> = ({
  currentQuestion,
  roundNumber,
  questionNumber,
  totalQuestions,
  players,
  playerAnswers,
  onCorrectAnswer,
  onWrongAnswer,
  onNextQuestion,
  timeLeft,
  showPendingAnswers,
  setShowPendingAnswers
}) => {
  const { language } = useLanguage();
  const { toast } = useToast();

  // Timer effect (unchanged)
  useEffect(() => {
    if (timeLeft === 0) {
      toast({
        title: language === 'it' ? 'Tempo scaduto!' : "Time's up!",
        description: language === 'it' ? 'Passaggio alla prossima domanda' : 'Moving to next question',
