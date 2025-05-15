
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { useTriviaGame } from '@/hooks/useTriviaGame';
import { Button } from "@/components/ui/button";
import NarratorView from '@/components/trivia/NarratorView';
import PlayerView from '@/components/trivia/PlayerView';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const TriviaGamePage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  
  const {
    currentRound,
    isNarrator,
    hasPlayerAnswered,
    currentQuestion,
    questionNumber,
    totalQuestions,
    playerAnswers,
    timeLeft,
    handlePlayerBuzzer,
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion
  } = useTriviaGame();
  
  useEffect(() => {
    // Verifica se la sessione di gioco è valida
    if (!state.gameId || !state.pin || !state.gameStarted) {
      toast({
        title: language === 'it' ? "Sessione non valida" : "Invalid session",
        description: language === 'it' 
          ? "Nessuna sessione di gioco attiva trovata" 
          : "No active game session found",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
    
    // Imposta il tipo di gioco se non è già impostato
    if (!state.selectedGame) {
      dispatch({ type: 'SELECT_GAME', payload: 'trivia' });
      sessionStorage.setItem('selectedGame', 'trivia');
    }
  }, [state.gameId, state.pin, state.gameStarted, state.selectedGame, navigate, dispatch, language, toast]);
  
  const handleBackToLobby = () => {
    navigate('/waiting-room');
  };
  
  // Se la sessione non è valida, non renderizzare nulla
  if (!state.gameId || !state.pin || !state.gameStarted) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToLobby}
              className="mr-2"
            >
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Trivia</h1>
          </div>
          
          <div className="bg-primary px-3 py-1 rounded-lg text-white text-center">
            <span className="text-sm font-semibold">{t('common.pin')}: </span>
            <span className="text-lg font-bold tracking-wider">{state.pin}</span>
          </div>
        </div>
        
        {/* Vista del narratore o del giocatore in base al ruolo */}
        {isNarrator ? (
          <NarratorView
            currentQuestion={currentQuestion}
            roundNumber={currentRound.roundNumber}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            players={state.players}
            playerAnswers={playerAnswers}
            onCorrectAnswer={handleCorrectAnswer}
            onWrongAnswer={handleWrongAnswer}
            onNextQuestion={handleNextQuestion}
            timeLeft={timeLeft}
          />
        ) : (
          <PlayerView
            roundNumber={currentRound.roundNumber}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            players={state.players}
            hasAnswered={hasPlayerAnswered}
            onBuzzerPressed={handlePlayerBuzzer}
            isCurrentPlayerNarrator={isNarrator}
          />
        )}
      </div>
    </div>
  );
};

export default TriviaGamePage;
