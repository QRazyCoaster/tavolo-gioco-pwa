
import { useGame } from '@/context/GameContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { playAudio } from '@/utils/audioUtils';
import { Player } from '@/context/GameContext';

export const useNarratorControls = () => {
  const { dispatch } = useGame();
  const { toast } = useToast();
  const { language } = useLanguage();
  
  // Assign point to a player
  const handleAssignPoint = (player: Player, queuedPlayers: Player[], setQueuedPlayers: React.Dispatch<React.SetStateAction<Player[]>>) => {
    playAudio('success');
    
    const newScore = (player.score || 0) + 1;
    dispatch({
      type: 'UPDATE_SCORE',
      payload: {
        playerId: player.id,
        score: newScore
      }
    });
    
    toast({
      title: language === 'it' ? "Punto assegnato!" : "Point assigned!",
      description: language === 'it' 
        ? `${player.name} guadagna un punto (${newScore} totali)` 
        : `${player.name} earns a point (${newScore} total)`
    });
    
    setQueuedPlayers(prev => prev.filter(p => p.id !== player.id));
  };
  
  // Remove player from queue without points
  const handleRemovePlayerFromQueue = (playerId: string, queuedPlayers: Player[], setQueuedPlayers: React.Dispatch<React.SetStateAction<Player[]>>, players: Player[]) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      playAudio('error');
      
      toast({
        title: language === 'it' ? "Giocatore rimosso" : "Player removed",
        description: language === 'it' 
          ? `${player.name} rimosso dalla coda` 
          : `${player.name} removed from queue`
      });
    }
    
    setQueuedPlayers(prev => prev.filter(p => p.id !== playerId));
  };
  
  return {
    handleAssignPoint,
    handleRemovePlayerFromQueue
  };
};
