
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import { useGame } from '@/context/GameContext';
import { supabase } from '@/supabaseClient';

export const useGameStarter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dispatch, state } = useGame();

  const handleStartGame = useCallback(async (selectedGame?: string) => {
    // Set gameStarted in state and sessionStorage
    sessionStorage.setItem('gameStarted', 'true');
    dispatch({ type: 'START_GAME' });
    
    // If a specific game was selected, save it
    if (selectedGame) {
      sessionStorage.setItem('selectedGame', selectedGame);
      dispatch({ type: 'SELECT_GAME', payload: selectedGame });
    }
    
    // Determine which game to start
    const game = selectedGame || sessionStorage.getItem('selectedGame') || 'trivia';
    
    // Update the database to notify all players that the game has started
    if (state.gameId) {
      try {
        console.log(`[GameStarter] Attempting to update game ${state.gameId} status to started with game type: ${game}`);
        const { error } = await supabase
          .from('games')
          .update({ 
            status: 'active',  // Update 'status' column instead of 'started'
            started: true,     // Keep this for backward compatibility
            game_type: game 
          })
          .eq('id', state.gameId);
        
        if (error) {
          console.error('[GameStarter] Error updating game status:', error);
          toast({
            title: "Error starting game",
            description: "There was a problem starting the game. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        console.log(`[GameStarter] Game ${state.gameId} marked as started with game type: ${game}`);
        
        // Play success sound
        playAudio('success');
        
        // Show notification toast
        toast({
          title: "Game Starting",
          description: "Get ready to play!",
        });
        
        // Navigate to the appropriate game page
        if (game === 'trivia') {
          navigate('/trivia');
        } else {
          navigate('/game');
        }
      } catch (error) {
        console.error('[GameStarter] Error updating game status:', error);
        toast({
          title: "Error starting game",
          description: "There was a problem starting the game. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      console.error('[GameStarter] Cannot start game: No gameId in state');
      toast({
        title: "Error starting game",
        description: "Game session not found. Please try rejoining the game.",
        variant: "destructive"
      });
    }
    
  }, [navigate, toast, dispatch, state.gameId]);

  return { handleStartGame };
};
