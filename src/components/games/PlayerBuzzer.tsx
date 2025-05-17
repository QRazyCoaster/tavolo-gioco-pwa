
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from "@/components/ui/button";
import { GamepadIcon } from "lucide-react";
import { Player } from '@/context/GameContext';

interface PlayerBuzzerProps {
  onPlayerBuzz: () => void;
  queuedPlayers: Player[];
  currentPlayerId?: string;
}

const PlayerBuzzer: React.FC<PlayerBuzzerProps> = ({
  onPlayerBuzz,
  queuedPlayers,
  currentPlayerId
}) => {
  const { language } = useLanguage();
  
  const hasAnswered = currentPlayerId 
    ? queuedPlayers.some(p => p.id === currentPlayerId)
    : false;
  
  return (
    <div className="mt-4">
      <Button 
        variant="default"
        className={`w-full py-8 text-lg flex items-center justify-center gap-2 ${
          hasAnswered
            ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
            : ""
        }`}
        onClick={onPlayerBuzz}
        disabled={hasAnswered}
      >
        <GamepadIcon size={24} />
        {hasAnswered
          ? (language === 'it' ? "IN ATTESA" : "WAITING") 
          : (language === 'it' ? "BUZZER" : "BUZZ IN")}
      </Button>
    </div>
  );
};

export default PlayerBuzzer;
