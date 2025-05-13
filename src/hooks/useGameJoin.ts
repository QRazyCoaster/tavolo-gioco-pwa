
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabaseClient';
import { createGame } from '@/actions/createGame';
import { joinGame } from '@/actions/joinGame';

export const useGameJoin = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const [pin, setPin] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPinError, setShowPinError] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Function to generate a game PIN
  const generateGamePin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Helper function to log player data for debugging
  const logPlayerData = (player: any, source: string) => {
    console.log(`[${source}] Player data:`, player);
    console.log(`[${source}] Player buzzer URL:`, player.buzzer_sound_url);
    
    if (!player.buzzer_sound_url) {
      console.warn(`[${source}] WARNING: No buzzer URL for player`);
    }
  };

  const handlePlayerRole = (host: boolean) => {
    setIsHost(host);
    playAudio('buttonClick');
    
    if (host) {
      // Generate PIN for host
      const gamePin = generateGamePin();
      setPin(gamePin);
    }
  };
  
  const handlePinChange = (value: string) => {
    setPin(value);
    if (showPinError) setShowPinError(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
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
        title: t('common.error'),
        description: t('common.errorCreatingGame'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          title: t('common.error'),
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
        title: t('common.error'),
        description: t('common.errorJoiningGame'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    playAudio('buttonClick');
    if (isHost !== null) {
      setIsHost(null);
      setPin('');
      setName('');
      setShowPinError(false);
    } else {
      navigate('/rules');
    }
  };

  return {
    pin,
    name,
    isHost,
    loading,
    showPinError,
    handlePlayerRole,
    handlePinChange,
    handleNameChange,
    handleHostNameSubmit,
    handlePlayerFormSubmit,
    handleBack
  };
};
