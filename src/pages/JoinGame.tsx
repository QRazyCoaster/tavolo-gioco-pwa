
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
    playAudio('buttonClick');
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
  
  const handleCreateGame = () => {
    playAudio('buttonClick');
    navigate('/create');
  };
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundImage: `url('/lovable-uploads/3513380f-9e72-4df5-a6b6-1cdbe36f3f30.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-6">{t('common.joinGame')}</h2>
        </div>
        
        {!pin ? (
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
            <GamePinInput onSubmit={handlePinSubmit} />
          </div>
        ) : (
          <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
            <PlayerNameInput onSubmit={handleNameSubmit} />
          </div>
        )}
        
        <div className="flex gap-4 mt-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="bg-white/80 backdrop-blur-sm"
          >
            {t('common.back')}
          </Button>
          
          {!pin && (
            <Button 
              variant="outline" 
              onClick={handleCreateGame}
              className="bg-white/80 backdrop-blur-sm"
            >
              {t('common.create')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinGame;
