
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
      console.log('Creating game with name:', name);
      const { game, hostPlayer } = await createGame({
        gameType: 'trivia',
        hostName: name
      });

      console.log('Game created:', game);
      console.log('Host player:', hostPlayer);

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
      console.error('Error creating game:', error);
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
      console.log("Form validation failed:", { pin, name });
      return;
    }
    
    try {
      setLoading(true);
      console.log('Joining game with PIN:', pin);
      console.log('Player name:', name);
      
      // 1. recupera l'id partita a partire dal PIN
      const { data: gameRow, error: gErr } = await supabase
        .from('games')
        .select('id')
        .eq('pin_code', pin)
        .single();
        
      console.log('Game lookup result:', gameRow, gErr);
        
      if (gErr || !gameRow) {
        console.error('Invalid PIN or game not found:', gErr);
        toast({
          title: t('common.error'),
          description: language === 'it' ? 'PIN non valido' : 'Invalid PIN',
          variant: "destructive",
        });
        setShowPinError(true);
        return;
      }

      // 2. crea il player e assegna il suono buzzer
      console.log('Creating player for game ID:', gameRow.id);
      const player = await joinGame({
        gameId: gameRow.id,
        playerName: name
      });

      console.log('Player created:', player);

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
      console.error('Error joining game:', error);
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
