
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage, Language } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { useNavigate } from 'react-router-dom';
import { preloadAudio, gameAudioFiles, playAudio } from '@/utils/audioUtils';
import { useEffect, useState } from 'react';

const Index = () => {
  const { setLanguage } = useLanguage();
  const { state } = useGame();
  const navigate = useNavigate();
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Preload audio files when component mounts
  useEffect(() => {
    const loadAudio = async () => {
      await preloadAudio(gameAudioFiles);
      setAudioLoaded(true);
    };
    
    loadAudio();
  }, []);

  const handleLanguageSelect = (language: Language) => {
    setLanguage(language);
    playAudio('buttonClick');
    navigate('/join');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{ 
        backgroundImage: `url('/lovable-uploads/3513380f-9e72-4df5-a6b6-1cdbe36f3f30.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
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
