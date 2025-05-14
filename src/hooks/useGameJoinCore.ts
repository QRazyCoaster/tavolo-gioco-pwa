
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';

/**
 * Core hook for game join functionality providing shared state and navigation
 */
export const useGameJoinCore = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const [pin, setPin] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPinError, setShowPinError] = useState<boolean>(false);
  
  // Generate a game PIN (4-digit code)
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
    setPin,
    name,
    setName,
    isHost,
    setIsHost,
    loading,
    setLoading,
    showPinError,
    setShowPinError,
    dispatch,
    navigate,
    language,
    handlePlayerRole,
    handlePinChange,
    handleNameChange,
    handleBack,
    generateGamePin
  };
};
