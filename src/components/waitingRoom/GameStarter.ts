
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { playAudio, stopBackgroundMusic } from '@/utils/audioUtils';
import { useGame } from '@/context/GameContext';
import { supabase } from '@/supabaseClient';

export const useGameStarter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dispatch, state } = useGame();

  const handleStartGame = useCallback(async (selectedGame?: string) => {
    console.log(`Starting game with type: ${selectedGame || 'default'}`);

    // Set gameStarted in state and sessionStorage
    sessionStorage.setItem('gameStarted', 'true');
    dispatch({ type: 'START_GAME' });
    
    // If a specific game was selected, save it
    if (selectedGame) {
      sessionStorage.setItem('selectedGame', selectedGame);
      dispatch({ type: 'SELECT_GAME', payload: selectedGame });
    } else {
      // Default to trivia if no game type is specified
      sessionStorage.setItem('selectedGame', 'trivia');
      dispatch({ type: 'SELECT_GAME', payload: 'trivia' });
    }
    
    // Stop background music as game is starting
    console.log('GameStarter: Stopping background music as game is starting');
    stopBackgroundMusic();
    dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
    
    // Determine which game to start
    const game = selectedGame || sessionStorage.getItem('selectedGame') || 'trivia';
    
    // Update the database to notify all players that the game has started
    if (state.gameId) {
      try {
        // Get the host's name
        const hostName = state.players.find(p => p.isHost)?.name || '';
        
        // Update game status to active in database
        // Removed any reference to narrator_order since it belongs in players table
        const { data, error } = await supabase
          .from('games')
          .update({ 
            status: 'active',
            game_type: game,
            host_name: hostName,
            current_round: 1
          })
          .eq('id', state.gameId)
          .select();
        
        if (error) {
          console.error('Error updating game status:', error);
          toast({
            title: "Error starting game",
            description: "There was a problem starting the game. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        console.log('Game successfully marked as active:', data);
        
        // Try to play success sounds
        try {
          playAudio('success', { volume: 0.6 });
          playAudio('gameStart', { volume: 0.5 });
        } catch (error) {
          console.error('Error playing game start sounds:', error);
        }
        
        // Show notification toast
        toast({
          title: "Game Starting",
          description: "Get ready to play!",
        });
        
        // Add a short delay before navigation to ensure state updates are processed
        setTimeout(() => {
          // Navigate to the appropriate game page
          console.log(`GameStarter: Navigating to /${game}`);
          if (game === 'trivia') {
            navigate('/trivia');
          } else {
            navigate('/game');
          }
        }, 500);
      } catch (error) {
        console.error('Error updating game status:', error);
        toast({
          title: "Error starting game",
          description: "There was a problem starting the game. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      console.error('Cannot start game: No gameId in state');
      toast({
        title: "Error starting game",
        description: "Game session not found. Please try rejoining the game.",
        variant: "destructive"
      });
    }
    
  }, [navigate, toast, dispatch, state.gameId, state.players]);

  return { handleStartGame };
};
