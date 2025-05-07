
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { playAudio } from '@/utils/audioUtils';

// This is a placeholder for the actual game components
// In a real app, you would have separate components for each game type
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
  
  // Find the selected game from our available games
  const selectedGame = state.selectedGame;
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Tavolo Gioco</h1>
        <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-lg text-center">
          <span className="text-sm font-semibold">{t('common.pin')}: </span>
          <span className="text-lg font-bold tracking-wider">{state.pin}</span>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-center">
        <Card className="w-full max-w-md p-6 mb-6">
          <h2 className="text-3xl font-semibold text-center mb-4">
            {selectedGame ? selectedGame : 'Game'}
          </h2>
          <p className="text-center mb-8">
            {language === 'it' 
              ? 'Contenuto del gioco qui' 
              : 'Game content here'}
          </p>
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">{t('common.players')}:</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {state.players.map(player => (
                <div 
                  key={player.id}
                  className={`px-3 py-1 rounded-full text-white ${player.isHost ? 'bg-primary' : 'bg-secondary'}`}
                >
                  {player.name}: {player.score || 0}
                </div>
              ))}
            </div>
          </div>
          
          {state.currentPlayer?.isHost && (
            <Button 
              className="w-full" 
              variant="destructive"
              onClick={handleEndGame}
            >
              {t('common.endGame')}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
};

export default GamePage;
