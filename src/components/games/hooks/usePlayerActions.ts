
import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { playAudio } from '@/utils/audioUtils';
import { Player } from '@/context/GameContext';

export const usePlayerActions = () => {
  const { state } = useGame();
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const handlePlayerBuzz = (queuedPlayers: Player[], setQueuedPlayers: React.Dispatch<React.SetStateAction<Player[]>>) => {
    if (!state.currentPlayer) {
      return;
    }
    
    // Play buzzer sound
    if (window.myBuzzer) {
      window.myBuzzer.play();
    } else {
      playAudio('notification');
    }
    
    // Add player to queue if not already present
    if (!queuedPlayers.some(p => p.id === state.currentPlayer?.id)) {
      const newQueue = [...queuedPlayers, state.currentPlayer];
      setQueuedPlayers(newQueue);
      
      toast({
        title: language === 'it' ? "Giocatore in coda!" : "Player queued!",
        description: language === 'it' 
          ? `${state.currentPlayer.name} si è prenotato per rispondere` 
          : `${state.currentPlayer.name} is queued to answer`
      });
    }
  };
  
  return { handlePlayerBuzz };
};
