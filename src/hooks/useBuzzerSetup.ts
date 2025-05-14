
import { useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext';
import { checkAndFixBuzzer } from '@/utils/playerUtils';
import { supabase } from '@/supabaseClient';

export const useBuzzerSetup = (fixAttempted: boolean, setFixAttempted: React.Dispatch<React.SetStateAction<boolean>>) => {
  const { state, dispatch } = useGame();
  // Add a ref to track if we've already loaded this buzzer URL
  const loadedBuzzerRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if no current player or if we've already loaded this buzzer URL
    if (!state.currentPlayer || loadedBuzzerRef.current === state.currentPlayer.buzzer_sound_url) {
      return;
    }
    
    // Debug log to check currentPlayer (only once when it changes)
    console.log('[WAITING_ROOM] Current player data:', state.currentPlayer);
    console.log('[WAITING_ROOM] Current player buzzer:', state.currentPlayer?.buzzer_sound_url);
    
    // Auto-fix if no buzzer found
    if (!state.currentPlayer.buzzer_sound_url) {
      console.log('[WAITING_ROOM] Current player has no buzzer sound URL, auto-fixing...');
      checkAndFixBuzzer(
        supabase,
        state.currentPlayer,
        (updatedPlayer: any) => dispatch({ type: 'SET_CURRENT_PLAYER', payload: updatedPlayer })
      );
      return;
    }
    
    // Use currentPlayer instead of player
    try {
      console.log('[WAITING_ROOM] Loading buzzer sound from URL:', state.currentPlayer.buzzer_sound_url);
      
      // Save the current buzzer URL to prevent reloading
      loadedBuzzerRef.current = state.currentPlayer.buzzer_sound_url;
      
      const s = new Audio(state.currentPlayer.buzzer_sound_url);
      s.preload = 'auto';
      window.myBuzzer = s;
      
      // Try to load the buzzer sound to verify the URL is valid
      s.addEventListener('canplaythrough', () => {
        console.log('[WAITING_ROOM] Buzzer sound loaded successfully!');
      });
      
      s.addEventListener('error', (e) => {
        console.error('[WAITING_ROOM] Error loading buzzer sound:', e);
        console.error('[WAITING_ROOM] Invalid buzzer URL:', state.currentPlayer?.buzzer_sound_url);
        
        // Reset the ref so we can try again with a fixed URL
        loadedBuzzerRef.current = null;
        
        // If loading fails, try to fix it automatically
        console.log('[WAITING_ROOM] Attempting to auto-fix invalid buzzer URL...');
        checkAndFixBuzzer(
          supabase,
          state.currentPlayer,
          (updatedPlayer: any) => dispatch({ type: 'SET_CURRENT_PLAYER', payload: updatedPlayer })
        );
      });
    } catch (err) {
      console.error('[WAITING_ROOM] Exception creating Audio element:', err);
      loadedBuzzerRef.current = null; // Reset on error
    }
  }, [state.currentPlayer, dispatch]);
};
