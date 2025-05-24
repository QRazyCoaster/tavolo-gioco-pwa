import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { useTriviaGame } from '@/hooks/useTriviaGame';
import { Button } from '@/components/ui/button';
import NarratorView from '@/components/trivia/NarratorView';
import PlayerView from '@/components/trivia/PlayerView';
import RoundBridgePage from '@/components/trivia/RoundBridgePage';
import GameOverPage from '@/components/trivia/GameOverPage';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { stopBackgroundMusic } from '@/utils/audioUtils';

const TriviaGamePage = () => {
  const { t, language }    = useLanguage();
  const navigate            = useNavigate();
  const { state, dispatch } = useGame();
  const { toast }           = useToast();
  const [isLoading, setIsLoading] = useState(true);

  /* ─────────── Game-round hook ─────────── */
  const {
    currentRound,
    isNarrator,
    hasPlayerAnswered,
    currentQuestion,
    questionNumber,
    totalQuestions,
    playerAnswers,
    timeLeft,
    showPendingAnswers,
    setShowPendingAnswers,
    handlePlayerBuzzer,
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion,
    showRoundBridge,
    nextNarrator,
    nextRoundNumber,
    startNextRound,
    gameOver,
    setGameOver
  } = useTriviaGame();

  /* ───────── Stop waiting-room music ─
