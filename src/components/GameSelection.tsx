
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/context/LanguageContext';
import { availableGames } from '@/utils/gameUtils';
import { playAudio } from '@/utils/audioUtils';

interface GameSelectionProps {
  onSelectGame: (gameId: string) => void;
}

const GameSelection = ({ onSelectGame }: GameSelectionProps) => {
  const { language, t } = useLanguage();
  
  const handleSelectGame = (gameId: string) => {
    playAudio('buttonClick');
    onSelectGame(gameId);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <h2 className="text-3xl font-bold mb-6">{t('common.chooseGame')}</h2>
      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        {availableGames.map((game) => (
          <Card 
            key={game.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleSelectGame(game.id)}
          >
            <div className="flex flex-col">
              <h3 className="text-2xl font-semibold mb-2">
                {language === 'it' ? game.nameIt : game.nameEn}
              </h3>
              <p className="text-gray-600 mb-4">
                {language === 'it' ? game.descriptionIt : game.descriptionEn}
              </p>
              <p className="text-sm text-gray-500">
                {game.minPlayers} - {game.maxPlayers} {t('common.players')}
              </p>
              <Button 
                className="mt-4" 
                variant="default"
                onClick={() => handleSelectGame(game.id)}
              >
                {t('common.select')}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GameSelection;
