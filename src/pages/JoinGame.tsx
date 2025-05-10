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


const JoinGame = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { dispatch, state } = useGame();
  const [pin, setPin] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean | null>(null);
  
  const handlePlayerRole = (host: boolean) => {
    setIsHost(host);
    playAudio('buttonClick');
    
    if (host) {
      // Generate PIN for host
      const gamePin = generateGamePin();
      setPin(gamePin);
    }
  };
  
  const handlePinSubmit = (enteredPin: string) => {
    setPin(enteredPin);
    playAudio('buttonClick');
  };
  
const handleHostNameSubmit = async (name: string) => {
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
};

// ⚠️ Assicurati di avere in cima al file:
// import { supabase } from '@/supabaseClient';
// import { joinGame }   from '@/actions/joinGame';

const handlePlayerNameSubmit = async (name: string) => {
  // 1. recupera l’id partita a partire dal PIN
  const { data: gameRow, error: gErr } = await supabase
    .from('games')
    .select('id')
    .eq('pin_code', pin)
    .single();
  if (gErr || !gameRow) {
    console.error('PIN non valido', gErr);
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
};

  
  const handleBack = () => {
    playAudio('buttonClick');
    if (pin && isHost !== null) {
      setPin(null);
      setIsHost(null);
    } else if (isHost !== null) {
      setIsHost(null);
    } else {
      navigate('/rules');
    }
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
          
          <PlayerNameInput onSubmit={handleHostNameSubmit} />
        </div>
      );
    } else if (!isHost && !pin) {
      // Player - Enter PIN
      return (
        <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
          <GamePinInput onSubmit={handlePinSubmit} />
        </div>
      );
    } else {
      // Player - Enter name after PIN
      return (
        <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
          <PlayerNameInput onSubmit={handlePlayerNameSubmit} />
        </div>
      );
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
