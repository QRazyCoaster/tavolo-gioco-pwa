
import React from 'react';
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
