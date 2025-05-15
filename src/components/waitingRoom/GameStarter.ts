
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import { useGame } from '@/context/GameContext';

export const useGameStarter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dispatch } = useGame();

  const handleStartGame = useCallback((selectedGame?: string) => {
    // Set gameStarted in state and sessionStorage
    sessionStorage.setItem('gameStarted', 'true');
    dispatch({ type: 'START_GAME' });
    
    // If a specific game was selected, save it
    if (selectedGame) {
      sessionStorage.setItem('selectedGame', selectedGame);
      dispatch({ type: 'SELECT_GAME', payload: selectedGame });
    }
    
    // Play success sound
    playAudio('success');
    
    // Show notification toast
    toast({
      title: "Game Starting",
      description: "Get ready to play!",
    });
    
    // Navigate to the appropriate game page
    const game = selectedGame || sessionStorage.getItem('selectedGame') || 'trivia';
    
    if (game === 'trivia') {
      navigate('/trivia');
    } else {
      navigate('/game');
    }
    
  }, [navigate, toast, dispatch]);

  return { handleStartGame };
};
