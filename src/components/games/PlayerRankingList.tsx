
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Player } from '@/context/GameContext';

interface PlayerRankingListProps {
  players: Player[];
}

const PlayerRankingList: React.FC<PlayerRankingListProps> = ({ players }) => {
  const { language } = useLanguage();
  
  return (
    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
      <h3 className="font-semibold mb-2">
        {language === 'it' ? "Classifica:" : "Ranking:"}
      </h3>
      <div className="space-y-2">
        {players.map((player, index) => (
          <div key={player.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-5">{index + 1}.</span>
              <span>{player.name}</span>
            </div>
            <span className="font-semibold">{player.score || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerRankingList;
