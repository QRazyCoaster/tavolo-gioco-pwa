
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import LanguageSelector from '@/components/LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { preloadAudio, gameAudioFiles, playAudio } from '@/utils/audioUtils';
import { Link } from 'react-router-dom';

const Index = () => {
  const { language, t } = useLanguage();
  const { state } = useGame();
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [languageSelected, setLanguageSelected] = useState(false);

  // Preload audio files when component mounts
  useEffect(() => {
    const loadAudio = async () => {
      await preloadAudio(gameAudioFiles);
      setAudioLoaded(true);
    };
    
    loadAudio();
  }, []);

  const handleLanguageConfirm = () => {
    setLanguageSelected(true);
    playAudio('buttonClick');
  };

  if (!languageSelected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Tavolo Gioco</h1>
            <p className="text-xl text-gray-600">{t('common.welcome')}</p>
          </div>
          <LanguageSelector />
          <div className="mt-8 text-center">
            <Button 
              variant="default" 
              size="lg"
              className="w-full max-w-xs h-14 text-xl"
              onClick={handleLanguageConfirm}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-primary mb-2">Tavolo Gioco</h1>
          <p className="text-xl text-gray-600">{t('common.welcome')}</p>
        </div>
        
        <div className="grid gap-6">
          <Link to="/join">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center">
              <h2 className="text-2xl font-semibold mb-4">{t('common.joinGame')}</h2>
              <Button 
                variant="outline" 
                size="lg"
                className="w-full h-14 text-xl"
                onClick={() => playAudio('buttonClick')}
              >
                {t('common.join')}
              </Button>
            </Card>
          </Link>
          
          <Link to="/create">
            <Card className="p-8 hover:shadow-lg transition-shadow cursor-pointer flex flex-col items-center">
              <h2 className="text-2xl font-semibold mb-4">{t('common.createGame')}</h2>
              <Button 
                variant="default" 
                size="lg"
                className="w-full h-14 text-xl"
                onClick={() => playAudio('buttonClick')}
              >
                {t('common.create')}
              </Button>
            </Card>
          </Link>
        </div>
        
        {!audioLoaded && (
          <div className="mt-6 text-center text-gray-500">
            <p>{t('common.loadingResources')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
