
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from "@/components/ui/card";
import { Player } from '@/context/GameContext';
import { Trophy, Award } from "lucide-react";

interface WaitingForNarratorProps {
  sortedPlayers: Player[];
}

const WaitingForNarrator: React.FC<WaitingForNarratorProps> = ({ sortedPlayers }) => {
  const { language } = useLanguage();
  
  return (
    <Card className="p-6 w-full max-w-lg text-center">
      <p className="text-lg mb-4">
        {language === 'it' 
          ? "In attesa che il narratore mostri la domanda..." 
          : "Waiting for the narrator to show the question..."}
      </p>
      
      <div className="mt-6">
        <h3 className="font-semibold mb-2">
          {language === 'it' ? "Classifica attuale:" : "Current ranking:"}
        </h3>
        <div className="space-y-2">
          {sortedPlayers.slice(0, 3).map((player, index) => (
            <div key={player.id} className="flex items-center justify-between bg-primary/5 p-2 rounded-md">
              <div className="flex items-center gap-2">
                {index === 0 && <Trophy size={16} className="text-yellow-500" />}
                {index === 1 && <Award size={16} className="text-gray-400" />}
                {index === 2 && <Award size={16} className="text-amber-700" />}
                <span>{player.name}</span>
              </div>
              <span className="font-semibold">{player.score || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default WaitingForNarrator;
