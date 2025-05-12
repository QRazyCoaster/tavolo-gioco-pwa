import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { useLanguage, Language } from '@/context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  preloadAudio,
  preloadButtonClickSound,
  playClickBuffer,
  gameAudioFiles,
  playBackgroundMusic,
  stopBackgroundMusic,
} from '@/utils/audioUtils';
import { useGame } from '@/context/GameContext';

const Index = () => {
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);
  const { dispatch } = useGame();

  // Preload audio files once
  useEffect(() => {
    let isMounted = true;

    const loadAudio = async () => {
      try {
        await preloadAudio(gameAudioFiles);
        await preloadButtonClickSound();
        if (isMounted) {
          setAudioLoaded(true);
          console.log('Audio preloading complete');
        }
      } catch (error) {
        console.error('Error during audio preloading:', error);
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
      stopBackgroundMusic();
      console.log('Cleaning up sounds on exit');
    };
  }, []);

  // Stop music if tab is hidden (e.g. phone screen off)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopBackgroundMusic();
        setMusicStarted(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleLanguageSelect = (language: Language) => {
    setLanguage(language);

    playClickBuffer();

    if (audioLoaded && !musicStarted) {
      playBackgroundMusic('backgroundMusic', 0.2);
      dispatch({ type: 'START_BACKGROUND_MUSIC' });
      setMusicStarted(true);
    }

    navigate('/games');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{
        backgroundImage: `url('/lovable-uploads/3513380f-9e72-4df5-a6b6-1cdbe36f3f30.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md flex flex-col justify-end" style={{ height: '80vh' }}>
        <div className="grid gap-6 mb-12">
          <Card
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer bg-white/80 backdrop-blur-sm border-0 transform scale-80"
            style={{ transform: 'scale(0.8)' }}
            onClick={() => handleLanguageSelect('it')}
          >
            <div className="flex items-center justify-center">
              <span className="text-3xl mr-3">🇮🇹</span>
              <span className="text-3xl font-semibold">Italiano</span>
            </div>
          </Card>

          <Card
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer bg-white/80 backdrop-blur-sm border-0 transform scale-80"
            style={{ transform: 'scale(0.8)' }}
            onClick={() => handleLanguageSelect('en')}
          >
            <div className="flex items-center justify-center">
              <span className="text-3xl mr-3">🇬🇧</span>
              <span className="text-3xl font-semibold">English</span>
            </div>
          </Card>
        </div>

        {!audioLoaded && (
          <div className="mt-6 text-center text-white">
            <p className="drop-shadow-lg">Loading resources...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
