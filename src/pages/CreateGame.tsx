
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import PlayerNameInput from '@/components/PlayerNameInput';
import GameSelection from '@/components/GameSelection';
import { generateGamePin, generateId } from '@/utils/gameUtils';
import { playAudio } from '@/utils/audioUtils';

const CreateGame = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const [name, setName] = useState<string | null>(null);
  const [gameSelected, setGameSelected] = useState(false);
  
  const handleNameSubmit = (playerName: string) => {
    setName(playerName);
  };
  
  const handleGameSelect = (gameId: string) => {
    const playerId = generateId();
    const gamePin = generateGamePin();
    const gameId = generateId();
    
    dispatch({
      type: 'CREATE_GAME',
      payload: {
        gameId: gameId,
        pin: gamePin,
        host: {
          id: playerId,
          name: name as string,
          isHost: true,
          score: 0
        }
      }
    });
    
    dispatch({
      type: 'SELECT_GAME',
      payload: gameId
    });
    
    playAudio('success');
    navigate('/waiting-room');
  };
  
  const handleBack = () => {
    if (name) {
      setName(null);
    } else {
      navigate('/');
    }
    playAudio('buttonClick');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Tavolo Gioco</h1>
          <h2 className="text-2xl mb-6">{t('common.createGame')}</h2>
        </div>
        
        {!name ? (
          <PlayerNameInput onSubmit={handleNameSubmit} />
        ) : (
          <GameSelection onSelectGame={handleGameSelect} />
        )}
        
        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            onClick={handleBack}
          >
            {t('common.back')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateGame;
