
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useGame } from '@/context/GameContext';
import { Music, VolumeX } from "lucide-react";
import { playAudio, stopBackgroundMusic, playBackgroundMusic } from '@/utils/audioUtils';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface MusicToggleProps {
  className?: string;
}

const MusicToggle = ({ className = "" }: MusicToggleProps) => {
  const { t } = useLanguage();
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Effect to sync with localStorage
  useEffect(() => {
    const storedMusicState = localStorage.getItem('backgroundMusicEnabled');
    const shouldPlayMusic = storedMusicState === 'true';
    
    if (shouldPlayMusic && !state.backgroundMusicPlaying && audioInitialized) {
      console.log('🎵 Restoring background music from localStorage');
      playBackgroundMusic('backgroundMusic', 0.2);
      dispatch({ type: 'START_BACKGROUND_MUSIC' });
    }
  }, [audioInitialized, dispatch, state.backgroundMusicPlaying]);

  // Effect to handle user interaction to initialize audio
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!audioInitialized) {
        console.log('🎵 Audio initialized after user interaction');
        setAudioInitialized(true);
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      }
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [audioInitialized]);

  // Effect to handle visibility changes and sync with game state
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state.backgroundMusicPlaying) {
        // Update the game state when music is stopped due to visibility change
        dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // iOS/Safari specific events
    window.addEventListener('pagehide', () => {
      if (state.backgroundMusicPlaying) {
        dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
      }
    });
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', () => {
        if (state.backgroundMusicPlaying) {
          dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
        }
      });
    };
  }, [state.backgroundMusicPlaying, dispatch]);

  const toggleBackgroundMusic = () => {
    // Play button click sound first
    playAudio('buttonClick');
    
    if (state.backgroundMusicPlaying) {
      console.log('🎵 Stopping background music');
      stopBackgroundMusic();
      dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
      
      toast({
        title: t('common.musicDisabled'),
        description: t('common.musicDisabledDesc'),
        duration: 1500,
      });
    } else {
      console.log('🎵 Starting background music');
      playBackgroundMusic('backgroundMusic', 0.2);
      dispatch({ type: 'START_BACKGROUND_MUSIC' });
      
      toast({
        title: t('common.musicEnabled'),
        description: t('common.musicEnabledDesc'),
        duration: 1500,
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleBackgroundMusic}
      title={state.backgroundMusicPlaying ? t('common.muteMusic') : t('common.playMusic')}
      className={className}
    >
      {state.backgroundMusicPlaying ? <Music size={20} /> : <VolumeX size={20} />}
    </Button>
  );
};

export default MusicToggle;
