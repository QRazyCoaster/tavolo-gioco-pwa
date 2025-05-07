
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Tavolo Gioco</h1>
        </div>
        
        <div className="grid gap-6">
          <Card 
            className="p-8 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleLanguageSelect('it')}
          >
            <div className="flex items-center justify-center">
              <span className="text-2xl mr-2">🇮🇹</span>
              <span className="text-2xl font-semibold">Italiano</span>
            </div>
          </Card>
          
          <Card 
            className="p-8 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleLanguageSelect('en')}
          >
            <div className="flex items-center justify-center">
              <span className="text-2xl mr-2">🇬🇧</span>
              <span className="text-2xl font-semibold">English</span>
            </div>
          </Card>
        </div>
        
        {!audioLoaded && (
          <div className="mt-6 text-center text-gray-500">
            <p>Loading resources...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
