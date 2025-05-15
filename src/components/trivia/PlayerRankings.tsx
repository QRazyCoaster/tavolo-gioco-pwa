
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Player } from '@/context/GameContext';

interface PlayerRankingsProps {
  players: Player[];
}

const PlayerRankings: React.FC<PlayerRankingsProps> = ({ players }) => {
  const { language } = useLanguage();
  
  // Sort players by score (highest to lowest)
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-primary/10 px-4 py-2 font-semibold">
        {language === 'it' ? 'Classifica Giocatori' : 'Player Rankings'}
      </div>
      <ScrollArea className="h-56 w-full">
        <div className="p-4">
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.id} 
              className={`flex justify-between items-center py-2 border-b last:border-0 ${
                player.isHost ? 'font-medium' : ''
              }`}
            >
              <div className="flex items-center">
                <span className="text-gray-500 w-6">{index + 1}.</span>
                <span>{player.name}</span>
                {player.isHost && (
                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    Host
                  </span>
                )}
              </div>
              <span className="font-bold">{player.score || 0}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PlayerRankings;
