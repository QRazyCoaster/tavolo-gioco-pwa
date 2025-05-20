
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { playAudio, playBackgroundMusic } from '@/utils/audioUtils';
import MusicToggle from '@/components/MusicToggle';
import WaitingRoom from '@/components/WaitingRoom';
import { useBuzzerSetup } from '@/hooks/useBuzzerSetup';
import { useGameSession } from '@/hooks/useGameSession';
import { useGameStarter } from '@/components/waitingRoom/GameStarter';
import { useGame } from '@/context/GameContext';

// Add TypeScript interface to extend Window
declare global {
  interface Window {
    myBuzzer?: HTMLAudioElement;
    waitMusic?: HTMLAudioElement;
  }
}

const WaitingRoomPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

  // Custom hooks
  const { validSession } = useGameSession();
  // Pass dummy state setter that won't cause rerenders
  useBuzzerSetup(false, () => {});
  const { handleStartGame } = useGameStarter();
  
  // Set up background music for waiting room
  useEffect(() => {
    // Start background music when entering waiting room
    if (localStorage.getItem('backgroundMusicEnabled') !== 'false') {
      if (!state.backgroundMusicPlaying) {
        console.log('[WaitingRoomPage] Starting background music');
        playBackgroundMusic('backgroundMusic', 0.2);
        dispatch({ type: 'START_BACKGROUND_MUSIC' });
      }
      
      // Create waiting room specific music if needed
      if (!window.waitMusic) {
        console.log('[WaitingRoomPage] Creating waiting room music');
        window.waitMusic = new Audio();
        window.waitMusic.src = getAudioUrl('backgroundMusic'); 
        window.waitMusic.loop = true;
        window.waitMusic.volume = 0.2;
      }
    }
    
    return () => {
      // Don't stop music when leaving - game page will handle this
      console.log('[WaitingRoomPage] Component unmounting');
    };
  }, [dispatch, state.backgroundMusicPlaying]);
  
  // Debug session validation only once
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

// Helper function to get audio URL
function getAudioUrl(type: string): string {
  // Simple implementation, you can use the actual function from audioUtils if needed
  return 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/background-music.mp3';
}

export default WaitingRoomPage;
