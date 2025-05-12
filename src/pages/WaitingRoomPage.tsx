
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import WaitingRoom from '@/components/WaitingRoom';
import { playAudio, stopBackgroundMusic } from '@/utils/audioUtils';
import MusicToggle from '@/components/MusicToggle';

// Add TypeScript interface to extend Window
declare global {
  interface Window {
    myBuzzer?: HTMLAudioElement;
  }
}

const WaitingRoomPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

  React.useEffect(() => {
    // Use currentPlayer instead of player
    if (state.currentPlayer?.buzzer_sound_url) {
      const s = new Audio(state.currentPlayer.buzzer_sound_url);
      s.preload = 'auto';
      window.myBuzzer = s;
    }
  }, [state.currentPlayer]);

  const handleStartGame = () => {
    // Stop background music when game starts
    if (state.backgroundMusicPlaying) {
      stopBackgroundMusic();
      dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
    }
    
    dispatch({ type: 'START_GAME' });
    playAudio('success');
    navigate('/game');
  };
  
  const handleBack = () => {
    navigate('/');
    playAudio('buttonClick');
  };
  
  // Redirect if there's no game
  if (!state.gameId || !state.pin) {
    navigate('/');
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
