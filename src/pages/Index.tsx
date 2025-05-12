import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useLanguage, Language } from '@/context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  preloadAudio,
  preloadButtonClickSound,
  playClickBuffer,
  playBackgroundMusic,
  stopBackgroundMusic,
} from '@/utils/audioUtils';
import { useGame } from '@/context/GameContext';

const Index = () => {
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const [ready, setReady] = useState(false);
  const [musicStarted, setMusicStarted] = useState(false);

  /* preload exactly once per full page load */
  useEffect(() => {
    (async () => {
      await preloadAudio();
      await preloadButtonClickSound();
      setReady(true);
    })();
    return () => stopBackgroundMusic();                         // cleanup on unmount
  }, []);

  /* pause music if tab hidden / screen off */
  useEffect(() => {
    const v = () => document.hidden && stopBackgroundMusic();
    document.addEventListener('visibilitychange', v);
    return () => document.removeEventListener('visibilitychange', v);
  }, []);

  const handleLanguage = (lang: Language) => {
    setLanguage(lang);
    playClickBuffer();                                          // instant click
    if (ready && !musicStarted) {
      playBackgroundMusic('backgroundMusic', 0.2);
      dispatch({ type: 'START_BACKGROUND_MUSIC' });
      setMusicStarted(true);
    }
    navigate('/games');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cover"
         style={{ backgroundImage: "url('/lovable-uploads/3513380f-9e72-4df5-a6b6-1cdbe36f3f30.png')" }}>
      <div className="w-full max-w-md flex flex-col justify-end" style={{ height: '80vh' }}>
        <div className="grid gap-6 mb-12">
          <Card className="p-6 bg-white/80 backdrop-blur-sm cursor-pointer"
                onClick={() => handleLanguage('it')}>
            <div className="flex items-center justify-center"><span className="text-3xl mr-3">🇮🇹</span>Italiano</div>
          </Card>
          <Card className="p-6 bg-white/80 backdrop-blur-sm cursor-pointer"
                onClick={() => handleLanguage('en')}>
            <div className="flex items-center justify-center"><span className="text-3xl mr-3">🇬🇧</span>English</div>
          </Card>
        </div>
        {!ready && <p className="text-center text-white">Loading resources…</p>}
      </div>
    </div>
  );
};

export default Index;
