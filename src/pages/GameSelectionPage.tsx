
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { playAudio, playBackgroundMusic } from '@/utils/audioUtils';
import { BookText, Wine } from "lucide-react";
import MusicToggle from '@/components/MusicToggle';

const GameSelectionPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  
  // Effetto per avviare la musica di sottofondo all'accesso alla pagina
  useEffect(() => {
    if (!state.backgroundMusicPlaying) {
      playBackgroundMusic('backgroundMusic', 0.2);
      dispatch({ type: 'START_BACKGROUND_MUSIC' });
    }
  }, []);
  
  const handleGameSelect = (gameId: string) => {
    playAudio('buttonClick');
    
    dispatch({
      type: 'SELECT_GAME',
      payload: gameId
    });
    
    // Navigate to rules page instead of join
    navigate('/rules');
  };
  
  const handleBackToLanguage = () => {
    playAudio('buttonClick');
    navigate('/');
  };
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundImage: `url('/lovable-uploads/3513380f-9e72-4df5-a6b6-1cdbe36f3f30.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-8 w-full flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg">
            {t('common.chooseGame')}
          </h2>
          <MusicToggle className="bg-white/50 backdrop-blur-sm text-primary rounded-full" />
        </div>
        
        <div className="w-full space-y-4">
          <Card 
            className="bg-white/80 backdrop-blur-sm p-5 hover:bg-white/90 transition-colors cursor-pointer"
            onClick={() => handleGameSelect('trivia')}
          >
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <BookText size={28} className="text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {language === 'it' ? 'Trivia' : 'Trivia'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'it' 
                    ? 'Sfida le tue conoscenze con domande di cultura generale' 
                    : 'Test your knowledge with general knowledge questions'}
                </p>
              </div>
            </div>
          </Card>
          
          <Card 
            className="bg-white/80 backdrop-blur-sm p-5 hover:bg-white/90 transition-colors cursor-pointer"
            onClick={() => handleGameSelect('bottlegame')}
          >
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Wine size={28} className="text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {language === 'it' ? 'Gioco della Bottiglia' : 'Bottle Game'}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'it' 
                    ? 'Divertimento classico con la bottiglia che gira' 
                    : 'Classic fun with the spinning bottle'}
                </p>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="mt-8">
          <Button 
            variant="outline" 
            onClick={handleBackToLanguage}
            className="bg-white/80 backdrop-blur-sm"
          >
            {t('common.back')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameSelectionPage;
