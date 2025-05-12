
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
  
  // Redirect if there's no game
  useEffect(() => {
    if (!state.gameId || !state.pin || !state.gameStarted) {
      navigate('/');
    }
  }, [state.gameId, state.pin, state.gameStarted, navigate]);
  
  if (!state.gameId || !state.pin || !state.gameStarted) {
    return null;
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
