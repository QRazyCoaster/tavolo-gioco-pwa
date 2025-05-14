
import { useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { checkAndFixBuzzer } from '@/utils/playerUtils';
import { supabase } from '@/supabaseClient';

export const useBuzzerSetup = (fixAttempted: boolean, setFixAttempted: React.Dispatch<React.SetStateAction<boolean>>) => {
  const { state, dispatch } = useGame();

  useEffect(() => {
    // Debug log to check currentPlayer
    console.log('[WAITING_ROOM] Current player data:', state.currentPlayer);
    console.log('[WAITING_ROOM] Current player buzzer:', state.currentPlayer?.buzzer_sound_url);
    
    // Auto-fix on first render if no buzzer found
    if (state.currentPlayer && !state.currentPlayer.buzzer_sound_url && !fixAttempted) {
      console.log('[WAITING_ROOM] Current player has no buzzer sound URL, attempting to fix...');
      checkAndFixBuzzer(
        supabase,
        state.currentPlayer,
        (updatedPlayer: any) => dispatch({ type: 'SET_CURRENT_PLAYER', payload: updatedPlayer })
      );
      setFixAttempted(true);
    }
    
    // Use currentPlayer instead of player
    if (state.currentPlayer?.buzzer_sound_url) {
      try {
        console.log('[WAITING_ROOM] Loading buzzer sound from URL:', state.currentPlayer.buzzer_sound_url);
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
          
          // If loading fails, try to fix it
          if (!fixAttempted) {
            console.log('[WAITING_ROOM] Attempting to fix invalid buzzer URL...');
            setFixAttempted(true);
            checkAndFixBuzzer(
              supabase,
              state.currentPlayer,
              (updatedPlayer: any) => dispatch({ type: 'SET_CURRENT_PLAYER', payload: updatedPlayer })
            );
          }
        });
      } catch (err) {
        console.error('[WAITING_ROOM] Exception creating Audio element:', err);
      }
    } else {
      console.warn('[WAITING_ROOM] No buzzer sound URL for current player!');
    }
  }, [state.currentPlayer, fixAttempted, dispatch, setFixAttempted]);
};
