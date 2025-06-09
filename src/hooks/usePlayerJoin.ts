
// src/hooks/usePlayerJoin.ts
import { supabase } from '@/supabaseClient';
import { joinGame } from '@/actions/joinGame';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import { logPlayerData } from '@/utils/playerUtils';
import { useGameJoinCore } from './useGameJoinCore';

type Core = ReturnType<typeof useGameJoinCore>;

/**
 * Player-specific logic.
 * Receives the shared core instance from useGameJoinCore().
 */
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

    // Validate PIN & name
    if (!pin || pin.length !== 4 || !name.trim()) {
      setShowPinError(true);
      return;
    }

    setLoading(true);
    playAudio('buttonClick');

    try {
      // 1. Look up game ID, language, and status from the PIN
      const { data: gameRow, error: gErr } = await supabase
        .from('games')
        .select('id, language, status')
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

      // 1.5. Check if the game is still accepting players (status should be 'waiting')
      if (gameRow.status !== 'waiting') {
        const { t } = { t: (key: string) => {
          const translations: any = {
            'error.gameAlreadyStarted': {
              en: 'This game has already started and cannot accept new players.',
              it: 'Questo gioco è già iniziato e non può accettare nuovi giocatori.',
            },
            'error.gameNotAvailable': {
              en: 'This game is no longer available.',
              it: 'Questo gioco non è più disponibile.',
            }
          };
          return translations[key]?.[language] || key;
        }};
        
        const errorMessage = gameRow.status === 'active' 
          ? t('error.gameAlreadyStarted')
          : t('error.gameNotAvailable');
          
        toast({
          title: language === 'it' ? 'Accesso negato' : 'Access Denied',
          description: errorMessage,
          variant: "destructive",
        });
        setShowPinError(true);
        return;
      }

      // 2. Check if the game language matches the current language
      if (gameRow.language !== language) {
        const errorKey = gameRow.language === 'it' 
          ? 'error.languageMismatch.italian' 
          : 'error.languageMismatch.english';
        
        toast({
          title: language === 'it' ? 'Lingua non compatibile' : 'Language Mismatch',
          description: language === 'it' 
            ? (gameRow.language === 'it' 
              ? 'Questo gioco è stato creato in italiano. Per unirti, vai alla pagina Trivia Italiana.'
              : 'Questo gioco è stato creato in inglese. Per unirti, vai alla pagina Trivia Inglese.')
            : (gameRow.language === 'it'
              ? 'This game was created in Italian. Please go to the Italian Trivia page to join.'
              : 'This game was created in English. Please go to the English Trivia page to join.'),
          variant: "destructive",
        });
        setShowPinError(true);
        return;
      }

      // 3. Create the player in the game (language validation passed)
      const player = await joinGame({
        gameId: gameRow.id,
        playerName: name
      });
      logPlayerData(player, 'PLAYER_JOIN');

      // 4. Update global state and sessionStorage
      dispatch({
        type: 'JOIN_GAME',
        payload: { gameId: gameRow.id, pin, player }
      });
      sessionStorage.setItem('gameId', gameRow.id);
      sessionStorage.setItem('pin', pin);

      playAudio('success');
      navigate('/waiting-room');
    } catch (error) {
      console.error('[PLAYER_JOIN] Error joining game:', error);
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
