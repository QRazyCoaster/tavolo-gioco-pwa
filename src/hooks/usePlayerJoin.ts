
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
    
    try {
      setLoading(true);
      console.log('[PLAYER] Joining game with PIN:', pin);
      console.log('[PLAYER] Player name:', name);
      
      // 1. recupera l'id partita a partire dal PIN
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
        return;
      }

      // 2. crea il player e assegna il suono buzzer
      console.log('[PLAYER] Creating player for game ID:', gameRow.id);
      const player = await joinGame({
        gameId: gameRow.id,
        playerName: name
      });

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

      // 3. aggiorna stato globale e passa alla waiting-room
      dispatch({
        type: 'JOIN_GAME',
        payload: {
          gameId: gameRow.id,
          pin,
          player
        }
      });

      playAudio('success');
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
