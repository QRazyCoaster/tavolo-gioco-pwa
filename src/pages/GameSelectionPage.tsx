
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { availableGames } from '@/utils/gameUtils';
import { playAudio } from '@/utils/audioUtils';
import { ArrowLeft, GamepadIcon } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary">Tavolo Gioco</h1>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={handleBack}
            >
              <ArrowLeft size={20} />
            </Button>
            <MusicToggle />
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {language === 'it' ? 'Seleziona un gioco' : 'Select a game'}
        </h2>
        
        <div className="space-y-4">
          {availableGames.map((game) => (
            <Card 
              key={game.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
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
      </div>
    </div>
  );
};

export default GameSelectionPage;
