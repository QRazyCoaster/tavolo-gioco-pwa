
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from "@/components/ui/button";
import { GamepadIcon, LoaderCircle } from "lucide-react";
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
            ? "bg-blue-400 hover:bg-blue-400 cursor-not-allowed"
            : ""
        }`}
        onClick={onPlayerBuzz}
        disabled={hasAnswered}
      >
        {hasAnswered ? (
          <>
            <LoaderCircle size={24} className="animate-spin" />
            {language === 'it' ? "IN ATTESA" : "WAITING"}
          </>
        ) : (
          <>
            <GamepadIcon size={24} />
            {language === 'it' ? "BUZZER" : "BUZZ IN"}
          </>
        )}
      </Button>
    </div>
  );
};

export default PlayerBuzzer;
