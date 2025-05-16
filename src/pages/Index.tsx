
import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useLanguage, Language } from '@/context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { playAudio, playBackgroundMusic } from '@/utils/audioUtils';
import { useGame } from '@/context/GameContext';

const Index = () => {
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { dispatch } = useGame();

  useEffect(() => {
    // Try to start background music when the page loads
    try {
      playBackgroundMusic('backgroundMusic', 0.2);
      dispatch({ type: 'START_BACKGROUND_MUSIC' });
    } catch (error) {
      console.error('Failed to play background music:', error);
    }
  }, [dispatch]);

  const handleLanguage = (lang: Language) => {
    setLanguage(lang);
    
    try {
      // Play button click sound
      playAudio('buttonClick');
    } catch (error) {
      console.error('Failed to play button click:', error);
    }
    
    // Navigate to join page
    navigate('/join');
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
      </div>
    </div>
  );
};

export default Index;
