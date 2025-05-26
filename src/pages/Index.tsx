import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useLanguage, Language } from '@/context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { playAudio, playBackgroundMusic, preloadAudio } from '@/utils/audioUtils';
import { useGame } from '@/context/GameContext';
const Index = () => {
  const {
    setLanguage
  } = useLanguage();
  const navigate = useNavigate();
  const {
    dispatch
  } = useGame();

  // Preload audio files when component mounts
  useEffect(() => {
    console.log('Index: Preloading audio files');
    preloadAudio(); // Preload all audio files
  }, []);
  const handleLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      // First play button click sound
      playAudio('buttonClick');

      // Then play background music
      console.log('Index: Starting background music after language selection');
      playBackgroundMusic('backgroundMusic', 0.2);
      dispatch({
        type: 'START_BACKGROUND_MUSIC'
      });

      // Store the music state
      localStorage.setItem('backgroundMusicEnabled', 'true');
    } catch (error) {
      console.error('Failed to play sounds:', error);
    }

    // Navigate to games selection page instead of join
    navigate('/games');
  };
  return <div className="min-h-screen flex items-center justify-center p-4 bg-cover" style={{
    backgroundImage: "url('/lovable-uploads/3513380f-9e72-4df5-a6b6-1cdbe36f3f30.png')"
  }}>
      <div className="w-full max-w-md flex flex-col justify-end" style={{
      height: '80vh'
    }}>
        <div className="grid gap-6 mb-12">
          <Card className="p-6 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => handleLanguage('it')}>
            <div className="flex items-center justify-center text-2xl"><span className="text-3xl mr-3">🇮🇹</span>Giochi Italiani</div>
          </Card>
          <Card className="p-6 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => handleLanguage('en')}>
            <div className="flex items-center justify-center py-0 text-2xl"><span className="text-3xl mr-3">🇬🇧</span>English Games</div>
          </Card>
        </div>
      </div>
    </div>;
};
export default Index;
