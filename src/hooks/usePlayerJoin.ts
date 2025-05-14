
import { supabase } from '@/supabaseClient';
import { joinGame } from '@/actions/joinGame';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import { useGameJoinCore } from './useGameJoinCore';
import { logPlayerData } from '@/utils/playerUtils';

/**
 * Hook for handling player-specific game join logic
 */
export const usePlayerJoin = () => {
  const { 
    pin, name, setLoading, setShowPinError,
    dispatch, navigate, language
  } = useGameJoinCore();
  const { toast } = useToast();

  const handlePlayerFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin || !name.trim() || pin.length !== 4) {
      console.log("[PLAYER] Form validation failed:", { pin, name });
      return;
    }
    
    // Show loading state immediately to prevent double-clicks
    setLoading(true);
    console.log('[PLAYER] Joining game with PIN:', pin);
    console.log('[PLAYER] Player name:', name);
    
    try {
      // 1. First retrieve the game ID from the PIN
      console.log('[PLAYER] Retrieving game ID from PIN...');
      const { data: gameRow, error: gErr } = await supabase
        .from('games')
        .select('id')
        .eq('pin_code', pin)
        .single();
        
      console.log('[PLAYER] Game lookup result:', gameRow, gErr);
        
      if (gErr || !gameRow) {
        console.error('[PLAYER] Invalid PIN or game not found:', gErr);
        toast({
          title: language === 'it' ? 'Errore' : 'Error',
          description: language === 'it' ? 'PIN non valido' : 'Invalid PIN',
          variant: "destructive",
        });
        setShowPinError(true);
        setLoading(false);
        return;
      }

      // 2. Create player and assign buzzer sound
      console.log('[PLAYER] Creating player for game ID:', gameRow.id);
      const player = await joinGame({
        gameId: gameRow.id,
        playerName: name
      });

      console.log('[PLAYER] Player created successfully:', player);
      logPlayerData(player, 'PLAYER_JOIN');
      
      // Double-check buzzer URL directly from database
      if (!player.buzzer_sound_url) {
        console.log('[PLAYER] No buzzer URL in response, checking database directly...');
        const { data: playerCheck } = await supabase
          .from('players')
          .select('buzzer_sound_url')
          .eq('id', player.id)
          .single();
          
        console.log('[PLAYER] Database check result:', playerCheck);
        
        if (playerCheck && playerCheck.buzzer_sound_url) {
          player.buzzer_sound_url = playerCheck.buzzer_sound_url;
          console.log('[PLAYER] Updated buzzer URL from DB:', player.buzzer_sound_url);
        }
      }

      // 3. Update global state and prepare for navigation
      console.log('[PLAYER] Updating game state...');
      dispatch({
        type: 'JOIN_GAME',
        payload: {
          gameId: gameRow.id,
          pin,
          player
        }
      });

      // Play success sound before navigation
      playAudio('success');
      
      // Navigate immediately without any delays
      console.log('[PLAYER] Navigating to waiting room...');
      navigate('/waiting-room');
    } catch (error) {
      console.error('[PLAYER] Error joining game:', error);
      toast({
        title: language === 'it' ? 'Errore' : 'Error',
        description: language === 'it' ? 'Errore durante l\'accesso al gioco' : 'Error joining game',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { handlePlayerFormSubmit };
};
