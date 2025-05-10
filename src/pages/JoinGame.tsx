
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import GamePinInput from '@/components/GamePinInput';
import PlayerNameInput from '@/components/PlayerNameInput';
import { playAudio } from '@/utils/audioUtils';
import { Card } from "@/components/ui/card";
import { UserRoundIcon, Users } from "lucide-react";
import { createGame } from '@/actions/createGame';
import { supabase } from '@/supabaseClient';
import { joinGame } from '@/actions/joinGame';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const JoinGame = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { dispatch, state } = useGame();
  const [pin, setPin] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [isPinValid, setIsPinValid] = useState<boolean>(false);
  const [showPinError, setShowPinError] = useState<boolean>(false);
  const { toast } = useToast();
  
  const handlePlayerRole = (host: boolean) => {
    setIsHost(host);
    playAudio('buttonClick');
    
    if (host) {
      // Generate PIN for host
      const gamePin = generateGamePin();
      setPin(gamePin);
    }
  };
  
  const handlePinSubmit = async () => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setShowPinError(true);
      return;
    }
    
    playAudio('buttonClick');
    setShowPinError(false);
    
    try {
      // Verify the PIN exists in the database
      const { data: gameRow, error } = await supabase
        .from('games')
        .select('id')
        .eq('pin_code', pin)
        .single();
      
      if (error || !gameRow) {
        toast({
          title: t('common.error'),
          description: t('common.invalidPin'),
          variant: "destructive",
        });
        setShowPinError(true);
        return;
      }
      
      // PIN is valid
      setIsPinValid(true);
    } catch (error) {
      console.error('Error verifying PIN:', error);
      toast({
        title: t('common.error'),
        description: t('common.invalidPin'),
        variant: "destructive",
      });
      setShowPinError(true);
    }
  };
  
  const handleHostNameSubmit = async () => {
    if (!name.trim()) return;
    
    try {
      const { game, hostPlayer } = await createGame({
        gameType: 'trivia',
        hostName: name
      });

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
    }
  };

  const handlePlayerNameSubmit = async () => {
    if (!name.trim() || !pin) return;
    
    try {
      // 1. recupera l'id partita a partire dal PIN
      const { data: gameRow, error: gErr } = await supabase
        .from('games')
        .select('id')
        .eq('pin_code', pin)
        .single();
        
      if (gErr || !gameRow) {
        toast({
          title: t('common.error'),
          description: t('common.invalidPin'),
          variant: "destructive",
        });
        setShowPinError(true);
        return;
      }

      // 2. crea il player e assegna il suono buzzer
      const player = await joinGame({
        gameId: gameRow.id,
        playerName: name
      });

      // 3. aggiorna stato globale e passa alla waiting‑room
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
  
  const handlePinChange = (value: string) => {
    setPin(value);
    if (showPinError) setShowPinError(false);
  };
  
  const renderContent = () => {
    if (isHost === null) {
      // Initial screen - choose role
      return (
        <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h3 className="text-2xl font-semibold text-center mb-6">{t('common.chooseRole')}</h3>
          
          <div className="flex flex-col space-y-4">
            <Button 
              onClick={() => handlePlayerRole(true)}
              className="h-16 text-xl flex items-center justify-center gap-3"
            >
              <UserRoundIcon size={24} />
              {language === 'it' ? '1° narratore' : 'First Host'}
            </Button>
            
            <Button 
              onClick={() => handlePlayerRole(false)}
              variant="outline"
              className="h-16 text-xl flex items-center justify-center gap-3 bg-white/80"
            >
              <Users size={24} />
              {language === 'it' ? 'Gli altri giocatori' : 'Other Players'}
            </Button>
          </div>
        </div>
      );
    } else if (isHost && pin) {
      // Host - Show PIN and collect name
      return (
        <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-center mb-2">{t('common.yourGamePin')}</h3>
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-2 text-center">
              <span className="text-3xl font-bold tracking-wider">{pin}</span>
            </div>
            <p className="text-center text-sm text-gray-600">{t('common.sharePinWithPlayers')}</p>
          </div>
          
          <div className="mt-6">
            <form onSubmit={(e) => { e.preventDefault(); handleHostNameSubmit(); }} className="flex flex-col space-y-4 w-full">
              <label htmlFor="host-name" className="text-2xl font-semibold text-center">
                {t('common.chooseName')}
              </label>
              <input
                id="host-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-2xl text-center h-16 border rounded-md p-2"
                placeholder="Player name"
                maxLength={20}
              />
              <Button 
                type="submit"
                className="w-full h-14 text-xl" 
                variant="default" 
                disabled={!name.trim()}
              >
                {t('common.next')}
              </Button>
            </form>
          </div>
        </div>
      );
    } else if (!isHost) {
      // Player - Enter PIN and name together
      return (
        <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
          <form onSubmit={(e) => { e.preventDefault(); handlePinSubmit(); }} className="flex flex-col space-y-6">
            <div>
              <label className="text-2xl font-semibold text-center block mb-4">
                {t('common.enterPin')}
              </label>
              
              <div className="flex justify-center mb-2">
                <InputOTP 
                  maxLength={4} 
                  value={pin} 
                  onChange={handlePinChange}
                  pattern="\d{1}"
                  inputMode="numeric"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="h-16 w-16 text-2xl" />
                    <InputOTPSlot index={1} className="h-16 w-16 text-2xl" />
                    <InputOTPSlot index={2} className="h-16 w-16 text-2xl" />
                    <InputOTPSlot index={3} className="h-16 w-16 text-2xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              
              {showPinError && (
                <Alert variant="destructive" className="mt-2 mb-2">
                  <AlertDescription>
                    {language === 'it' ? 'PIN non valido' : 'Invalid PIN'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="mt-4">
              <label htmlFor="player-name" className="text-2xl font-semibold text-center block mb-4">
                {t('common.chooseName')}
              </label>
              <input
                id="player-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-2xl text-center h-16 w-full border rounded-md p-2"
                placeholder="Player name"
                maxLength={20}
              />
            </div>
            
            <Button 
              onClick={handlePlayerNameSubmit}
              className="w-full h-14 text-xl" 
              variant="default" 
              disabled={!pin || !name.trim() || pin.length !== 4}
            >
              {t('common.join')}
            </Button>
          </form>
        </div>
      );
    } else {
      // Default state (shouldn't reach here)
      return null;
    }
  };
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundImage: `url('/lovable-uploads/3513380f-9e72-4df5-a6b6-1cdbe36f3f30.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-md flex flex-col items-center">
        {renderContent()}
        
        <div className="flex gap-4 mt-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="bg-white/80 backdrop-blur-sm"
          >
            {t('common.back')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JoinGame;

// Function to generate a game PIN (this was missing but is referenced in the code)
const generateGamePin = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Add a missing import
import { 
  InputOTP,
  InputOTPGroup,
  InputOTPSlot 
} from "@/components/ui/input-otp";
