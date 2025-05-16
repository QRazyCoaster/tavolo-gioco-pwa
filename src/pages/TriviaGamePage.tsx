
import React, { useEffect, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  
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
    handleNextQuestion
  } = useTriviaGame();
  
  useEffect(() => {
    console.log('[TriviaGamePage] Game state:', {
      isNarrator,
      hasPlayerAnswered,
      playerAnswers: playerAnswers.length,
      playerAnswersData: playerAnswers,
      currentQuestion: currentQuestion?.id,
      gameId: state.gameId,
      pin: state.pin,
      gameStarted: state.gameStarted,
      sessionGameStarted: sessionStorage.getItem('gameStarted'),
      selectedGame: state.selectedGame,
      sessionSelectedGame: sessionStorage.getItem('selectedGame')
    });
    
    // Short delay to ensure the state is loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    // Verify if the game session is valid
    if (!state.gameId || !state.pin) {
      console.error('[TriviaGamePage] Invalid session - gameId or pin missing');
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
    
    // Restore game info from session storage if needed
    const sessionGameStarted = sessionStorage.getItem('gameStarted') === 'true';
    if (!state.gameStarted && !sessionGameStarted) {
      console.error('[TriviaGamePage] Game not started');
      toast({
        title: language === 'it' ? "Gioco non iniziato" : "Game not started",
        description: language === 'it'
          ? "Torna alla sala d'attesa"
          : "Return to the waiting room",
        variant: "destructive"
      });
      navigate('/waiting-room');
      return;
    } else if (!state.gameStarted && sessionGameStarted) {
      console.log('[TriviaGamePage] Setting game started from session storage');
      dispatch({ type: 'START_GAME' });
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
    
    return () => clearTimeout(timer);
  }, [isNarrator, playerAnswers, currentQuestion, state.gameId, state.pin, state.gameStarted, state.selectedGame, language, navigate, toast, dispatch]);
  
  useEffect(() => {
    // Debug logging for player answers at the page level
    console.log('[TriviaGamePage] Current playerAnswers:', playerAnswers);
    console.log('[TriviaGamePage] showPendingAnswers value:', showPendingAnswers);
    
    // Force the showPendingAnswers to be true when playerAnswers.length > 0
    if (playerAnswers.length > 0 && !showPendingAnswers && isNarrator) {
      console.log('[TriviaGamePage] Forcing showPendingAnswers to true');
      setShowPendingAnswers(true);
    }
  }, [playerAnswers, showPendingAnswers, setShowPendingAnswers, isNarrator]);
  
  const handleBackToLobby = () => {
    navigate('/waiting-room');
  };
  
  // Show a loading state while validating session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse flex space-x-2 mb-4 justify-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
          </div>
          <p className="text-gray-600">{language === 'it' ? 'Caricamento...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }
  
  console.log('[TriviaGamePage] Rendering view. isNarrator:', isNarrator);
  
  // If the session validation is still in progress, show a loading state
  if (!state.gameId || !state.pin) {
    return null;
  }
  
  // Debug logging to check what's being passed to NarratorView
  if (isNarrator) {
    console.log('[TriviaGamePage] Rendering NarratorView with playerAnswers:', playerAnswers);
    console.log('[TriviaGamePage] currentQuestion:', currentQuestion);
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
            showPendingAnswers={showPendingAnswers}
            setShowPendingAnswers={setShowPendingAnswers}
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
