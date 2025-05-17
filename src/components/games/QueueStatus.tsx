
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Player } from '@/context/GameContext';

interface QueueStatusProps {
  queuedPlayers: Player[];
  currentPlayerId?: string;
}

const QueueStatus: React.FC<QueueStatusProps> = ({ queuedPlayers, currentPlayerId }) => {
  const { language } = useLanguage();
  
  if (queuedPlayers.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
      <h3 className="font-semibold mb-2">
        {language === 'it' ? "Giocatori in coda:" : "Players in queue:"}
      </h3>
      <ol className="list-decimal pl-5 space-y-1">
        {queuedPlayers.map((player) => (
          <li key={player.id} className={`
            ${player.id === currentPlayerId ? "font-bold text-blue-700" : ""}
          `}>
            {player.name} {player.id === currentPlayerId ? 
              (language === 'it' ? "(tu)" : "(you)") : ""}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default QueueStatus;
