import { joinGame } from '@/actions/joinGame';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import { logPlayerData } from '@/utils/playerUtils';
import { useGameJoinCore } from './useGameJoinCore';

type Core = ReturnType<typeof useGameJoinCore>;

export const usePlayerJoin = (core: Core) => {
  const {
    pin,
    name,
    setLoading,
    setShowPinError,
    dispatch,
    navigate,
    language
  } = core;
  const { toast } = useToast();

  const handlePlayerFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!pin || pin.length !== 4 || !name.trim()) {
      return;
    }

    setLoading(true);
    playAudio('buttonClick');

    try {
      // 1. Lookup game ID from PIN
      const { data: gameRow, error: gErr } = await core.supabase
        .from('games')
        .select('id')
        .eq('pin_code', pin)
        .single();

      if (gErr || !gameRow) {
        toast({
          title: language === 'it' ? 'Errore' : 'Error',
          description: language === 'it' ? 'PIN non valido' : 'Invalid PIN',
          variant: "destructive",
        });
        setShowPinError(true);
        return;
      }

      // 2. Create player
      const player = await joinGame({
        gameId: gameRow.id,
        playerName: name
      });
      logPlayerData(player, 'PLAYER_JOIN');

      // 3. Update global state
      dispatch({
        type: 'JOIN_GAME',
        payload: {
          gameId: gameRow.id,
          pin,
          player
        }
      });
      sessionStorage.setItem('gameId', gameRow.id);
      sessionStorage.setItem('pin', pin);

      playAudio('success');
      navigate('/waiting-room');
    } catch (err) {
      console.error('[PLAYER_JOIN] Error joining game:', err);
      toast({
        title: language === 'it' ? 'Errore' : 'Error',
        description: language === 'it'
          ? 'Errore durante l\'accesso al gioco'
          : 'Error joining game',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { handlePlayerFormSubmit };
};
