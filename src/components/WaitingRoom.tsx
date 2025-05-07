
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';

interface WaitingRoomProps {
  onStartGame: () => void;
}

const WaitingRoom = ({ onStartGame }: WaitingRoomProps) => {
  const { t } = useLanguage();
  const { state } = useGame();
  const isHost = state.currentPlayer?.isHost;
  
  const handleStartGame = () => {
    playAudio('buttonClick');
    onStartGame();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <h2 className="text-3xl font-bold mb-4">{t('common.waitingForPlayers')}</h2>
      
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 text-center">
        <span className="block text-lg font-semibold mb-1">{t('common.pin')}: </span>
        <span className="text-3xl font-bold tracking-wider">{state.pin}</span>
      </div>
      
      <Card className="w-full max-w-md p-4 mb-6">
        <h3 className="text-xl font-semibold mb-2">{t('common.players')}</h3>
        <ul className="space-y-2">
          {state.players.map((player) => (
            <li 
              key={player.id} 
              className="p-3 bg-gray-50 rounded-md flex items-center justify-between"
            >
              <span className="text-lg">
                {player.name} 
                {player.isHost && (
                  <span className="ml-2 text-sm bg-primary text-white px-2 py-1 rounded-full">
                    {t('common.host')}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      
      {isHost && (
        <Button 
          className="w-full max-w-md h-14 text-xl" 
          variant="default"
          onClick={handleStartGame}
          disabled={state.players.length < 2}
        >
          {t('common.start')}
        </Button>
      )}
      
      {!isHost && (
        <div className="w-full max-w-md p-4 text-center">
          <p className="text-lg">{t('common.waitingForHost')}</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingRoom;
