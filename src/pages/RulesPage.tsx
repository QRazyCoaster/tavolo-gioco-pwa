
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import { Book, BookText, Wine } from "lucide-react";

const RulesPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { state } = useGame();
  
  const handleContinue = () => {
    playAudio('buttonClick');
    navigate('/join');
  };
  
  const handleBack = () => {
    playAudio('buttonClick');
    navigate('/games');
  };
  
  const renderGameRules = () => {
    switch (state.selectedGame) {
      case 'trivia':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BookText size={24} className="text-primary" />
              <h3 className="text-xl font-semibold">{t('games.trivia')}</h3>
            </div>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t('rules.trivia1')}</li>
              <li>{t('rules.trivia2')}</li>
              <li>{t('rules.trivia3')}</li>
              <li>{t('rules.trivia4')}</li>
            </ul>
          </div>
        );
      case 'bottlegame':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Wine size={24} className="text-primary" />
              <h3 className="text-xl font-semibold">{t('games.bottleGame')}</h3>
            </div>
            <ul className="list-disc pl-5 space-y-2">
              <li>{t('rules.bottle1')}</li>
              <li>{t('rules.bottle2')}</li>
              <li>{t('rules.bottle3')}</li>
              <li>{t('rules.bottle4')}</li>
            </ul>
          </div>
        );
      default:
        return (
          <div className="text-center p-4">
            <p>{t('common.noGameSelected')}</p>
          </div>
        );
    }
  };
  
  if (!state.selectedGame) {
    navigate('/games');
    return null;
  }
  
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
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
            {t('common.gameRules')}
          </h2>
          <p className="text-white drop-shadow-md">
            {t('common.readBeforePlaying')}
          </p>
        </div>
        
        <Card className="w-full bg-white/90 backdrop-blur-sm p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <Book size={28} className="text-primary mr-2" />
            <h3 className="text-xl font-semibold">{t('common.rules')}</h3>
          </div>
          
          {renderGameRules()}
        </Card>
        
        <div className="flex gap-4 mt-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="bg-white/80 backdrop-blur-sm"
          >
            {t('common.back')}
          </Button>
          
          <Button 
            onClick={handleContinue}
            className="bg-primary text-white"
          >
            {t('common.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RulesPage;
