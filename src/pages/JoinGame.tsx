
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import GamePinInput from '@/components/GamePinInput';
import PlayerNameInput from '@/components/PlayerNameInput';
import { generateId } from '@/utils/gameUtils';
import { playAudio } from '@/utils/audioUtils';

const JoinGame = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const [pin, setPin] = useState<string | null>(null);
  
  const handlePinSubmit = (enteredPin: string) => {
    setPin(enteredPin);
  };
  
  const handleNameSubmit = (name: string) => {
    const playerId = generateId();
    
    dispatch({
      type: 'JOIN_GAME',
      payload: {
        gameId: pin as string, // In a real app, we would validate this with the server
        pin: pin as string,
        player: {
          id: playerId,
          name: name,
          isHost: false,
          score: 0
        }
      }
    });
    
    playAudio('success');
    navigate('/waiting-room');
  };
  
  const handleBack = () => {
    playAudio('buttonClick');
    navigate('/');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Tavolo Gioco</h1>
          <h2 className="text-2xl mb-6">{t('common.joinGame')}</h2>
        </div>
        
        {!pin ? (
          <GamePinInput onSubmit={handlePinSubmit} />
        ) : (
          <PlayerNameInput onSubmit={handleNameSubmit} />
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

export default JoinGame;
