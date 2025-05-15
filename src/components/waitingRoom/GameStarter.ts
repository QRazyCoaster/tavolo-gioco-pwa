
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';

export const useGameStarter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStartGame = useCallback((selectedGame?: string) => {
    // Salva che il gioco è iniziato
    sessionStorage.setItem('gameStarted', 'true');
    
    // Se è stato selezionato un gioco specifico, salvalo
    if (selectedGame) {
      sessionStorage.setItem('selectedGame', selectedGame);
    }
    
    // Riproduce un audio all'avvio del gioco
    playAudio('success');
    
    // Mostra una notifica toast
    toast({
      title: "Game Starting",
      description: "Get ready to play!",
    });
    
    // Reindirizza alla pagina di gioco appropriata
    const game = selectedGame || sessionStorage.getItem('selectedGame') || 'trivia';
    
    // Naviga alla pagina specifica del gioco se disponibile, altrimenti alla pagina generica
    if (game === 'trivia') {
      navigate('/trivia');
    } else {
      navigate('/game');
    }
    
  }, [navigate, toast]);

  return { handleStartGame };
};
