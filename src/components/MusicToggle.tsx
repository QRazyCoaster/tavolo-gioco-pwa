
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
    console.log('MusicToggle: Toggle button clicked');
    try {
      // Play button click sound first
      playAudio('buttonClick');
      
      if (state.backgroundMusicPlaying) {
        console.log('MusicToggle: Stopping background music');
        stopBackgroundMusic();
        dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
        
        toast({
          title: t('common.musicDisabled') || 'Music Disabled',
          description: t('common.musicDisabledDesc') || 'Background music has been turned off.',
          duration: 1500,
        });
      } else {
        console.log('MusicToggle: Starting background music');
        playBackgroundMusic('backgroundMusic', 0.2);
        dispatch({ type: 'START_BACKGROUND_MUSIC' });
        
        toast({
          title: t('common.musicEnabled') || 'Music Enabled',
          description: t('common.musicEnabledDesc') || 'Background music has been turned on.',
          duration: 1500,
        });
      }
    } catch (error) {
      console.error('Error toggling background music:', error);
      toast({
        title: 'Error',
        description: 'Could not toggle music playback.',
        variant: 'destructive',
        duration: 3000,
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
