
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';

export const useGameSession = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const [validationComplete, setValidationComplete] = useState(false);
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    console.log('[useGameSession] Starting session check');
    
    // Check session storage first
    const sessionGameId = sessionStorage.getItem('gameId');
    const sessionPin = sessionStorage.getItem('pin');
    
    // We have a game in context, session is valid
    if (state.gameId && state.pin) {
      console.log('[useGameSession] Game found in state:', { 
        gameId: state.gameId, 
        pin: state.pin 
      });
      setIsValid(true);
      setValidationComplete(true);
      return;
    }
    
    // No game in state but found in session, try to recover
    if (sessionGameId && sessionPin) {
      console.log('[useGameSession] Game found in session storage:', { 
        sessionGameId, 
        sessionPin 
      });
      
      // Try to restore from session
      dispatch({ type: 'RESTORE_SESSION' });
      
      // Give it a moment to update state
      setTimeout(() => {
        if (state.gameId) {
          console.log('[useGameSession] Successfully restored from session');
          setIsValid(true);
        } else {
          console.log('[useGameSession] Failed to restore from session, redirecting');
          navigate('/');
        }
        setValidationComplete(true);
      }, 100);
    } 
    // No game in state or session, redirect to home
    else {
      console.log('[useGameSession] Missing gameId or pin, redirecting to home');
      setIsValid(false);
      setValidationComplete(true);
      navigate('/');
    }
  }, [state.gameId, state.pin, navigate, dispatch]);
  
  return { 
    validSession: isValid || !validationComplete, 
    validationComplete 
  };
};
