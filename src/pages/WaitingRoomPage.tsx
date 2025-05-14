
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { playAudio } from '@/utils/audioUtils';
import MusicToggle from '@/components/MusicToggle';
import WaitingRoom from '@/components/WaitingRoom';
import BuzzerFixButton from '@/components/waitingRoom/BuzzerFixButton';
import { useBuzzerSetup } from '@/hooks/useBuzzerSetup';
import { useGameSession } from '@/hooks/useGameSession';
import { useGameStarter } from '@/components/waitingRoom/GameStarter';
import { useGame } from '@/context/GameContext';

// Add TypeScript interface to extend Window
declare global {
  interface Window {
    myBuzzer?: HTMLAudioElement;
  }
}

const WaitingRoomPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [fixAttempted, setFixAttempted] = useState(false);
  const { state } = useGame();

  // Custom hooks
  const { validSession } = useGameSession();
  useBuzzerSetup(fixAttempted, setFixAttempted);
  const { handleStartGame } = useGameStarter();
  
  // Debug session validation
  useEffect(() => {
    console.log('[WaitingRoomPage] Session check:', { 
      validSession,
      gameId: state.gameId,
      pin: state.pin,
      sessionGameId: sessionStorage.getItem('gameId'),
      sessionPin: sessionStorage.getItem('pin')
    });
  }, [validSession, state.gameId, state.pin]);
  
  const handleBack = () => {
    navigate('/');
    playAudio('buttonClick');
  };
  
  // If session is invalid, don't render anything
  if (!validSession) {
    console.log('[WaitingRoomPage] Invalid session, not rendering content');
    return null;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary">Tavolo Gioco</h1>
          <MusicToggle />
        </div>
        
        <WaitingRoom onStartGame={handleStartGame} />
        
        {/* Add buzzer fix button component */}
        <BuzzerFixButton 
          fixAttempted={fixAttempted} 
          setFixAttempted={setFixAttempted} 
        />
        
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

export default WaitingRoomPage;
