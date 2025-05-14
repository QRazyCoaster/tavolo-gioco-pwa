
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { playAudio } from '@/utils/audioUtils';
import TriviaGame from '@/components/games/TriviaGame';

const GamePage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  
  const handleEndGame = () => {
    dispatch({ type: 'END_GAME' });
    playAudio('notification');
    navigate('/');
  };
  
  // Adding debug logs to see what values are causing redirection
  useEffect(() => {
    console.log('GamePage - Game state values:', {
      gameId: state.gameId,
      pin: state.pin,
      gameStarted: state.gameStarted,
      selectedGame: state.selectedGame,
      playersCount: state.players.length
    });
    
    if (!state.gameId || !state.pin) {
      console.log('GamePage - Missing gameId or pin, redirecting to home');
      navigate('/');
      return;
    }
    
    // Only redirect if the game hasn't been started - this allows refreshes
    if (!state.gameStarted && !sessionStorage.getItem('gameStarted')) {
      console.log('GamePage - Game not started, redirecting to home');
      navigate('/');
      return;
    }
    
    // Store game state in session storage to persist through refreshes
    if (state.gameStarted) {
      sessionStorage.setItem('gameStarted', 'true');
      sessionStorage.setItem('gameId', state.gameId);
      sessionStorage.setItem('pin', state.pin);
    }
  }, [state.gameId, state.pin, state.gameStarted, navigate]);
  
  // Recover from session storage if needed
  useEffect(() => {
    if (!state.gameStarted && sessionStorage.getItem('gameStarted') === 'true') {
      const gameId = sessionStorage.getItem('gameId');
      const pin = sessionStorage.getItem('pin');
      
      if (gameId && pin) {
        console.log('GamePage - Recovering game state from session storage');
        // Don't dispatch if we already have a gameId (prevents loops)
        if (!state.gameId) {
          dispatch({ type: 'START_GAME' });
        }
      }
    }
  }, [state.gameStarted, state.gameId, dispatch]);
  
  // If still not ready, show loading
  if (!state.gameId || !state.pin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-medium mb-4">Caricamento del gioco...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Renderizza il gioco in base al tipo selezionato
  const renderGame = () => {
    switch (state.selectedGame) {
      case 'trivia':
        return <TriviaGame />;
      case 'bottlegame':
        return (
          <div className="flex items-center justify-center p-10">
            <p className="text-xl font-semibold text-center">
              {language === 'it' 
                ? 'Gioco della Bottiglia in arrivo...' 
                : 'Bottle Game coming soon...'}
            </p>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center p-10">
            <p className="text-xl font-semibold text-center">
              {language === 'it' 
                ? 'Gioco non riconosciuto' 
                : 'Game not recognized'}
            </p>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Tavolo Gioco</h1>
        <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-lg text-center">
          <span className="text-sm font-semibold">{t('common.pin')}: </span>
          <span className="text-lg font-bold tracking-wider">{state.pin}</span>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-start">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-semibold">
            {state.selectedGame === 'trivia' 
              ? (language === 'it' ? 'Trivia' : 'Trivia') 
              : (language === 'it' ? 'Gioco della Bottiglia' : 'Bottle Game')}
          </h2>
        </div>
        
        {renderGame()}
        
        <div className="w-full max-w-md mt-6">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {state.players.map(player => (
              <div 
                key={player.id}
                className={`px-3 py-1 rounded-full text-white ${player.isHost ? 'bg-primary' : 'bg-secondary'}`}
              >
                {player.name}: {player.score || 0}
              </div>
            ))}
          </div>
          
          {state.currentPlayer?.isHost && (
            <Button 
              className="w-full mt-2" 
              variant="destructive"
              onClick={handleEndGame}
            >
              {t('common.endGame')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
