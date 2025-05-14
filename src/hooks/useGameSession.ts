
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context/GameContext';

export const useGameSession = () => {
  const navigate = useNavigate();
  const { state } = useGame();
  
  useEffect(() => {
    // Check session storage first
    const sessionGameId = sessionStorage.getItem('gameId');
    const sessionPin = sessionStorage.getItem('pin');
    
    // If no game in state but found in session, try to recover
    if ((!state.gameId || !state.pin) && sessionGameId && sessionPin) {
      console.log('WaitingRoomPage - Game found in session storage:', { sessionGameId, sessionPin });
      
      // Only recover if not already trying to recover
      if (!state.gameId && !state.pin) {
        // Don't recover if we've already started the game (to avoid loops)
        const sessionGameStarted = sessionStorage.getItem('gameStarted') === 'true';
        if (sessionGameStarted) {
          console.log('WaitingRoomPage - Game already started, redirecting to game');
          navigate('/game');
          return;
        }
      }
    } 
    // No game in state or session, redirect to home
    else if (!state.gameId || !state.pin) {
      console.log('WaitingRoomPage - Missing gameId or pin, redirecting to home');
      navigate('/');
    }
  }, [state.gameId, state.pin, navigate]);
  
  return { validSession: !!(state.gameId && state.pin) };
};
