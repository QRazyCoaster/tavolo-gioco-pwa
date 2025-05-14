
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
    
    console.log("[PLAYER_JOIN] Form submitted with:", { pin, name });
    
    if (!pin || !name.trim() || pin.length !== 4) {
      console.log("[PLAYER_JOIN] Form validation failed:", { 
        pin, name, 
        pinValid: pin && pin.length === 4,
        nameValid: name && name.trim().length > 0
      });
      return;
    }
    
    // Show loading state immediately to prevent double-clicks
    setLoading(true);
    console.log('[PLAYER_JOIN] Joining game with PIN:', pin);
    console.log('[PLAYER_JOIN] Player name:', name);
    
    // Play sound to confirm button click
    playAudio('buttonClick');
    
    try {
      // 1. First retrieve the game ID from the PIN
      console.log('[PLAYER_JOIN] Retrieving game ID from PIN...');
      const { data: gameRow, error: gErr } = await supabase
        .from('games')
        .select('id')
        .eq('pin_code', pin)
        .single();
        
      console.log('[PLAYER_JOIN] Game lookup result:', gameRow, gErr);
        
      if (gErr || !gameRow) {
        console.error('[PLAYER_JOIN] Invalid PIN or game not found:', gErr);
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
      console.log('[PLAYER_JOIN] Creating player for game ID:', gameRow.id);
      const player = await joinGame({
        gameId: gameRow.id,
        playerName: name
      });

      console.log('[PLAYER_JOIN] Player created successfully:', player);
      logPlayerData(player, 'PLAYER_JOIN');
      
      // Double-check buzzer URL directly from database
      if (!player.buzzer_sound_url) {
        console.log('[PLAYER_JOIN] No buzzer URL in response, checking database directly...');
        const { data: playerCheck } = await supabase
          .from('players')
          .select('buzzer_sound_url')
          .eq('id', player.id)
          .single();
          
        console.log('[PLAYER_JOIN] Database check result:', playerCheck);
        
        if (playerCheck && playerCheck.buzzer_sound_url) {
          player.buzzer_sound_url = playerCheck.buzzer_sound_url;
          console.log('[PLAYER_JOIN] Updated buzzer URL from DB:', player.buzzer_sound_url);
        }
      }

      // 3. Update global state and prepare for navigation
      console.log('[PLAYER_JOIN] Updating game state...');
      dispatch({
        type: 'JOIN_GAME',
        payload: {
          gameId: gameRow.id,
          pin,
          player
        }
      });

      // Store session data in sessionStorage
      sessionStorage.setItem('gameId', gameRow.id);
      sessionStorage.setItem('pin', pin);
      console.log('[PLAYER_JOIN] Stored session data:', { gameId: gameRow.id, pin });

      // Play success sound before navigation
      playAudio('success');
      
      // Navigate to waiting room
      console.log('[PLAYER_JOIN] Navigating to waiting room...');
      navigate('/waiting-room');
    } catch (error) {
      console.error('[PLAYER_JOIN] Error joining game:', error);
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
