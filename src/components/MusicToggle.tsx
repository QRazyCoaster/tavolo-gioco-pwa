
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useGame } from '@/context/GameContext';
import { Music, VolumeX } from "lucide-react";
import { playAudio, stopBackgroundMusic, playBackgroundMusic } from '@/utils/audioUtils';
import { useLanguage } from '@/context/LanguageContext';

interface MusicToggleProps {
  className?: string;
}

const MusicToggle = ({ className = "" }: MusicToggleProps) => {
  const { t } = useLanguage();
  const { state, dispatch } = useGame();

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
    playAudio('buttonClick');
    
    if (state.backgroundMusicPlaying) {
      stopBackgroundMusic();
      dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
    } else {
      playBackgroundMusic('backgroundMusic', 0.2);
      dispatch({ type: 'START_BACKGROUND_MUSIC' });
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
