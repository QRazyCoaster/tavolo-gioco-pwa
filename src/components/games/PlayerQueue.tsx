
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from "@/components/ui/button";
import { Player } from '@/context/GameContext';
import { PlusIcon } from "lucide-react";

interface PlayerQueueProps {
  queuedPlayers: Player[];
  onAssignPoint: (player: Player) => void;
  onRemoveFromQueue: (playerId: string) => void;
}

const PlayerQueue: React.FC<PlayerQueueProps> = ({
  queuedPlayers,
  onAssignPoint,
  onRemoveFromQueue
}) => {
  const { language } = useLanguage();
  
  if (queuedPlayers.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <h3 className="font-semibold mb-3 text-blue-800">
        {language === 'it' ? "Giocatori prenotati:" : "Queued players:"}
      </h3>
      <div className="space-y-2">
        {queuedPlayers.map((player, index) => (
          <div key={player.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm">
                {index + 1}
              </span>
              <span className="font-medium">{player.name}</span>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
                onClick={() => onAssignPoint(player)}
              >
                <PlusIcon size={16} />
                <span>1</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => onRemoveFromQueue(player.id)}
              >
                ✕
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerQueue;
