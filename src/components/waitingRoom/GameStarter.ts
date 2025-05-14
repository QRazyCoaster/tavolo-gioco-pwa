
import { useGame } from '@/context/GameContext';
import { playAudio, stopBackgroundMusic } from '@/utils/audioUtils';
import { useNavigate } from 'react-router-dom';

export const useGameStarter = () => {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  
  const handleStartGame = () => {
    // Stop background music when game starts
    if (state.backgroundMusicPlaying) {
      stopBackgroundMusic();
      dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
    }
    
    // Set the selected game if it's not set (default to trivia)
    if (!state.selectedGame) {
      dispatch({ type: 'SELECT_GAME', payload: 'trivia' });
    }
    
    dispatch({ type: 'START_GAME' });
    
    // Fix: Store complete game data in session storage for persistence
    sessionStorage.setItem('gameStarted', 'true');
    sessionStorage.setItem('gameId', state.gameId || '');
    sessionStorage.setItem('pin', state.pin || '');
    sessionStorage.setItem('selectedGame', state.selectedGame || 'trivia');
    
    console.log('WaitingRoomPage - Game started, stored in session:', {
      gameId: state.gameId,
      pin: state.pin,
      selectedGame: state.selectedGame || 'trivia'
    });
    
    playAudio('success');
    navigate('/game');
  };
  
  return { handleStartGame };
};
