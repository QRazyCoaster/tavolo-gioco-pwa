
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import WaitingRoom from '@/components/WaitingRoom';
import { playAudio, stopBackgroundMusic } from '@/utils/audioUtils';
import MusicToggle from '@/components/MusicToggle';
import { supabase } from '@/supabaseClient';

// Add TypeScript interface to extend Window
declare global {
  interface Window {
    myBuzzer?: HTMLAudioElement;
  }
}

const WaitingRoomPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();

  // Function to check and fix buzzer assignment
  const checkAndFixBuzzer = async () => {
    if (!state.currentPlayer?.id || !state.gameId) return;
    
    console.log('Checking buzzer for player:', state.currentPlayer.id);
    
    // Check if player has buzzer_sound_url in DB
    const { data, error } = await supabase
      .from('players')
      .select('buzzer_sound_url')
      .eq('id', state.currentPlayer.id)
      .single();
      
    if (error) {
      console.error('Error checking player buzzer:', error);
      return;
    }
    
    console.log('DB check - Player buzzer URL:', data?.buzzer_sound_url);
    
    // If no buzzer found, assign one directly
    if (!data?.buzzer_sound_url) {
      console.log('No buzzer found for player, attempting to fix...');
      const baseUrl = 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/buzzers/';
      
      // Get a list of available sounds
      const { data: files, error: listError } = await supabase
        .storage
        .from('audio')
        .list('buzzers');
        
      if (listError || !files || files.length === 0) {
        console.error('Could not fetch buzzer sounds:', listError);
        return;
      }
      
      // Pick a random sound
      const randomSound = files[Math.floor(Math.random() * files.length)];
      const buzzerUrl = baseUrl + randomSound.name;
      console.log('Assigning new buzzer URL:', buzzerUrl);
      
      // Update the player record
      const { data: updateData, error: updateError } = await supabase
        .from('players')
        .update({ buzzer_sound_url: buzzerUrl })
        .eq('id', state.currentPlayer.id)
        .select();
        
      if (updateError) {
        console.error('Error updating buzzer URL:', updateError);
      } else {
        console.log('Buzzer URL updated successfully:', updateData);
        
        // Update the current player in state
        if (updateData && updateData[0]) {
          const updatedPlayer = {
            ...state.currentPlayer,
            buzzer_sound_url: buzzerUrl
          };
          console.log('Updating current player with new buzzer:', updatedPlayer);
          dispatch({ type: 'SET_CURRENT_PLAYER', payload: updatedPlayer });
        }
      }
    }
  };

  useEffect(() => {
    // Debug log to check currentPlayer
    console.log('Current player in WaitingRoomPage:', state.currentPlayer);
    
    // Check if we need to debug/fix the buzzer assignment
    if (state.currentPlayer && !state.currentPlayer.buzzer_sound_url) {
      console.log('Current player has no buzzer sound URL, attempting to fix...');
      checkAndFixBuzzer();
    }
    
    // Use currentPlayer instead of player
    if (state.currentPlayer?.buzzer_sound_url) {
      const s = new Audio(state.currentPlayer.buzzer_sound_url);
      s.preload = 'auto';
      window.myBuzzer = s;
      
      // Try to load the buzzer sound to verify the URL is valid
      s.addEventListener('canplaythrough', () => {
        console.log('Buzzer sound loaded successfully!');
      });
      
      s.addEventListener('error', (e) => {
        console.error('Error loading buzzer sound:', e);
        console.error('Invalid buzzer URL:', state.currentPlayer?.buzzer_sound_url);
      });
    } else {
      console.warn('No buzzer sound URL for current player!');
    }
  }, [state.currentPlayer]);

  const handleStartGame = () => {
    // Stop background music when game starts
    if (state.backgroundMusicPlaying) {
      stopBackgroundMusic();
      dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
    }
    
    dispatch({ type: 'START_GAME' });
    playAudio('success');
    navigate('/game');
  };
  
  const handleBack = () => {
    navigate('/');
    playAudio('buttonClick');
  };
  
  // Redirect if there's no game
  if (!state.gameId || !state.pin) {
    navigate('/');
    return null;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary">Tavolo Gioco</h1>
          <MusicToggle />
        </div>
        
        <WaitingRoom onStartGame={handleStartGame} />
        
        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            onClick={handleBack}
          >
            {t('common.back')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoomPage;
