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
    console.log('[TriviaGamePage] Game state:', {
      isNarrator,
      playerAnswers,
      currentQuestion
    });
    
    // Verify if the game session is valid
    if (!state.gameId || !state.pin) {
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
    
    // Check if game is started
    if (!state.gameStarted && sessionStorage.getItem('gameStarted') !== 'true') {
      toast({
        title: language === 'it' ? "Gioco non iniziato" : "Game not started",
        description: language === 'it'
          ? "Torna alla sala d'attesa"
          : "Return to the waiting room",
        variant: "destructive"
      });
      navigate('/waiting-room');
      return;
    }
    
    // Set the game type if not already set
    if (!state.selectedGame) {
      const savedGame = sessionStorage.getItem('selectedGame');
      if (savedGame) {
        console.log(`[TriviaGamePage] Setting game type from session: ${savedGame}`);
        dispatch({ type: 'SELECT_GAME', payload: savedGame });
      } else {
        console.log('[TriviaGamePage] No game type found, defaulting to trivia');
        dispatch({ type: 'SELECT_GAME', payload: 'trivia' });
        sessionStorage.setItem('selectedGame', 'trivia');
      }
    }
  }, [isNarrator, playerAnswers, currentQuestion]);
  
  const handleBackToLobby = () => {
    navigate('/waiting-room');
  };
  
  // If the session validation is still in progress, show a loading state
  if (!state.gameId || !state.pin) {
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
        
        {/* Narrator or player view based on role */}
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
