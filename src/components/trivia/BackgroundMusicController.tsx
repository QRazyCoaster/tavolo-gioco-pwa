
import { useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { stopBackgroundMusic, pauseAudio, stopAudio } from '@/utils/audioUtils';

const BackgroundMusicController = () => {
  const { dispatch } = useGame();
  
  useEffect(() => {
    console.log('[BackgroundMusicController] Component mounted - stopping all background music');
    
    // Use multiple methods to ensure music stops, especially on iOS
    pauseAudio('backgroundMusic');
    stopAudio('backgroundMusic');
    stopBackgroundMusic();
    
    // Also stop any music on window.waitMusic which might be used on some devices
    if ((window as any).waitMusic) {
      try {
        console.log('[BackgroundMusicController] Stopping window.waitMusic');
        (window as any).waitMusic.pause();
        (window as any).waitMusic.currentTime = 0;
      } catch (e) {
        console.error('[BackgroundMusicController] Error stopping wait music:', e);
      }
    }
    
    // Update state to reflect that music is stopped
    dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
    
    // Explicitly set the localStorage flag
    localStorage.setItem('backgroundMusicEnabled', 'false');
    
    // Additional iOS workaround - create and immediately stop an audio context
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContext.suspend().then(() => {
        console.log('[BackgroundMusicController] AudioContext suspended');
      });
    } catch (error) {
      console.error('[BackgroundMusicController] Error with AudioContext:', error);
    }
  }, []); // runs once
  
  return null; // This is a non-visual component
};

export default BackgroundMusicController;
