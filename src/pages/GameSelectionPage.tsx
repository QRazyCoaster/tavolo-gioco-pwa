
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { availableGames } from '@/utils/gameUtils';
import { playAudio } from '@/utils/audioUtils';
import { GamepadIcon } from 'lucide-react';
import MusicToggle from '@/components/MusicToggle';

const GameSelectionPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { state } = useGame();
  
  const handleSelectGame = (gameId: string) => {
    // Just store selected game in sessionStorage for now (no game created yet)
    sessionStorage.setItem('selectedGame', gameId);
    playAudio('buttonClick');
    
    // Go to join page to create/join game
    navigate('/join');
  };
  
  const handleBack = () => {
    // Go back to language selection
    navigate('/');
    playAudio('buttonClick');
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
        <div className="w-full flex justify-end mb-4">
          <MusicToggle className="bg-white/50 backdrop-blur-sm text-primary rounded-full" />
        </div>
        
        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg mb-6 text-center w-full">
          <h2 className="text-2xl font-semibold">
            {language === 'it' ? 'Seleziona un gioco' : 'Select a game'}
          </h2>
        </div>
        
        <div className="space-y-4 w-full">
          {availableGames.map((game) => (
            <Card 
              key={game.id}
              className="cursor-pointer hover:shadow-md transition-shadow bg-white/90 backdrop-blur-sm"
              onClick={() => handleSelectGame(game.id)}
            >
              <CardContent className="p-6 flex items-center">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <GamepadIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {language === 'it' ? game.nameIt : game.nameEn}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {language === 'it' ? game.descriptionIt : game.descriptionEn}
                  </p>
                  <div className="text-xs text-gray-400 mt-1">
                    {language === 'it' 
                      ? `${game.minPlayers}-${game.maxPlayers} giocatori` 
                      : `${game.minPlayers}-${game.maxPlayers} players`}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-6">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="bg-white/80 backdrop-blur-sm"
          >
            {language === 'it' ? 'Indietro' : 'Back'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameSelectionPage;
