
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import { createGame } from '@/actions/createGame';
import { useGameJoinCore } from './useGameJoinCore';
import { logPlayerData } from '@/utils/playerUtils';
import { supabase } from '@/supabaseClient';

/**
 * Hook for handling host-specific game join logic
 */
export const useHostJoin = () => {
  const { 
    name, setName, setLoading, dispatch, navigate, language
  } = useGameJoinCore();
  const { toast } = useToast();

  // New handler for name changes
  const handleHostNameChange = (newName: string) => {
    setName(newName);
  };

  const handleHostNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    try {
      setLoading(true);
      console.log('[HOST] Creating game with name:', name);
      const { game, hostPlayer } = await createGame({
        gameType: 'trivia',
        hostName: name
      });

      console.log('[HOST] Game created:', game);
      logPlayerData(hostPlayer, 'HOST_CREATE');

      // Double-check buzzer URL directly from database
      if (!hostPlayer.buzzer_sound_url) {
        console.log('[HOST] No buzzer URL in response, checking database directly...');
        const { data: playerCheck } = await supabase
          .from('players')
          .select('buzzer_sound_url')
          .eq('id', hostPlayer.id)
          .single();
          
        console.log('[HOST] Database check result:', playerCheck);
        
        if (playerCheck && playerCheck.buzzer_sound_url) {
          hostPlayer.buzzer_sound_url = playerCheck.buzzer_sound_url;
          console.log('[HOST] Updated buzzer URL from DB:', hostPlayer.buzzer_sound_url);
        }
      }

      dispatch({
        type: 'CREATE_GAME',
        payload: {
          gameId: game.id,
          pin: game.pin_code,
          host: hostPlayer
        }
      });

      playAudio('success');
      navigate('/waiting-room');
    } catch (error) {
      console.error('[HOST] Error creating game:', error);
      toast({
        title: language === 'it' ? 'Errore' : 'Error',
        description: language === 'it' ? 'Errore durante la creazione del gioco' : 'Error creating game',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { handleHostNameSubmit, handleHostNameChange };
};
