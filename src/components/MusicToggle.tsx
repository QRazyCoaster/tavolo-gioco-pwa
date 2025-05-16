
import React from 'react';
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

  const toggleBackgroundMusic = () => {
    try {
      // Play button click sound first
      playAudio('buttonClick');
      
      if (state.backgroundMusicPlaying) {
        stopBackgroundMusic();
        dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
        
        toast({
          title: t('common.musicDisabled'),
          description: t('common.musicDisabledDesc'),
          duration: 1500,
        });
      } else {
        playBackgroundMusic('backgroundMusic', 0.2);
        dispatch({ type: 'START_BACKGROUND_MUSIC' });
        
        toast({
          title: t('common.musicEnabled'),
          description: t('common.musicEnabledDesc'),
          duration: 1500,
        });
      }
    } catch (error) {
      console.error('Error toggling background music:', error);
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
