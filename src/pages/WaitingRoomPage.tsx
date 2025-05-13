
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import WaitingRoom from '@/components/WaitingRoom';
import { playAudio, stopBackgroundMusic } from '@/utils/audioUtils';
import MusicToggle from '@/components/MusicToggle';
import { supabase } from '@/supabaseClient';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [fixAttempted, setFixAttempted] = useState(false);

  // Function to check and fix buzzer assignment
  const checkAndFixBuzzer = async () => {
    if (!state.currentPlayer?.id || !state.gameId) {
      console.error('[BUZZER_FIX] No current player or game ID available');
      return false;
    }
    
    console.log('[BUZZER_FIX] Checking buzzer for player:', state.currentPlayer.id);
    
    // Check if player has buzzer_sound_url in DB
    const { data, error } = await supabase
      .from('players')
      .select('buzzer_sound_url, name')
      .eq('id', state.currentPlayer.id)
      .single();
      
    if (error) {
      console.error('[BUZZER_FIX] Error checking player buzzer:', error);
      return false;
    }
    
    console.log('[BUZZER_FIX] DB check - Player:', data?.name);
    console.log('[BUZZER_FIX] DB check - Player buzzer URL:', data?.buzzer_sound_url);
    
    // If buzzer found in DB but not in state, update state
    if (data?.buzzer_sound_url && !state.currentPlayer.buzzer_sound_url) {
      console.log('[BUZZER_FIX] Buzzer found in DB but missing in state, updating state');
      
      const updatedPlayer = {
        ...state.currentPlayer,
        buzzer_sound_url: data.buzzer_sound_url
      };
      
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: updatedPlayer });
      console.log('[BUZZER_FIX] Updated current player with DB buzzer:', updatedPlayer);
      return true;
    }
    
    // If no buzzer found, assign one directly
    if (!data?.buzzer_sound_url) {
      console.log('[BUZZER_FIX] No buzzer found for player, attempting to fix...');
      const baseUrl = 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/buzzers/';
      
      // Get a list of available sounds
      const { data: files, error: listError } = await supabase
        .storage
        .from('audio')
        .list('buzzers');
        
      if (listError || !files || files.length === 0) {
        console.error('[BUZZER_FIX] Could not fetch buzzer sounds:', listError);
        return false;
      }
      
      console.log('[BUZZER_FIX] Available buzzer sounds:', files.map(f => f.name));
      
      // Pick a random sound
      const randomSound = files[Math.floor(Math.random() * files.length)];
      const buzzerUrl = baseUrl + randomSound.name;
      console.log('[BUZZER_FIX] Assigning new buzzer URL:', buzzerUrl);
      
      // Update the player record
      const { data: updateData, error: updateError } = await supabase
        .from('players')
        .update({ buzzer_sound_url: buzzerUrl })
        .eq('id', state.currentPlayer.id)
        .select();
        
      if (updateError) {
        console.error('[BUZZER_FIX] Error updating buzzer URL:', updateError);
        return false;
      } else {
        console.log('[BUZZER_FIX] Buzzer URL updated successfully:', updateData);
        
        // Update the current player in state
        if (updateData && updateData[0]) {
          const updatedPlayer = {
            ...state.currentPlayer,
            buzzer_sound_url: buzzerUrl
          };
          console.log('[BUZZER_FIX] Updating current player with new buzzer:', updatedPlayer);
          dispatch({ type: 'SET_CURRENT_PLAYER', payload: updatedPlayer });
          
          // Final verification
          const { data: verifyData } = await supabase
            .from('players')
            .select('buzzer_sound_url')
            .eq('id', state.currentPlayer.id)
            .single();
          
          console.log('[BUZZER_FIX] Final verification - DB buzzer URL:', verifyData?.buzzer_sound_url);
          return true;
        }
      }
    }
    
    return false;
  };

  const handleFixBuzzer = async () => {
    setFixAttempted(true);
    const success = await checkAndFixBuzzer();
    if (success) {
      toast({
        title: "Buzzer Update",
        description: "Successfully fixed buzzer sound!",
      });
    } else {
      toast({
        title: "Buzzer Update Failed",
        description: "Could not assign buzzer sound. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Debug log to check currentPlayer
    console.log('[WAITING_ROOM] Current player data:', state.currentPlayer);
    console.log('[WAITING_ROOM] Current player buzzer:', state.currentPlayer?.buzzer_sound_url);
    
    // Auto-fix on first render if no buzzer found
    if (state.currentPlayer && !state.currentPlayer.buzzer_sound_url && !fixAttempted) {
      console.log('[WAITING_ROOM] Current player has no buzzer sound URL, attempting to fix...');
      checkAndFixBuzzer();
    }
    
    // Use currentPlayer instead of player
    if (state.currentPlayer?.buzzer_sound_url) {
      try {
        console.log('[WAITING_ROOM] Loading buzzer sound from URL:', state.currentPlayer.buzzer_sound_url);
        const s = new Audio(state.currentPlayer.buzzer_sound_url);
        s.preload = 'auto';
        window.myBuzzer = s;
        
        // Try to load the buzzer sound to verify the URL is valid
        s.addEventListener('canplaythrough', () => {
          console.log('[WAITING_ROOM] Buzzer sound loaded successfully!');
        });
        
        s.addEventListener('error', (e) => {
          console.error('[WAITING_ROOM] Error loading buzzer sound:', e);
          console.error('[WAITING_ROOM] Invalid buzzer URL:', state.currentPlayer?.buzzer_sound_url);
        });
      } catch (err) {
        console.error('[WAITING_ROOM] Exception creating Audio element:', err);
      }
    } else {
      console.warn('[WAITING_ROOM] No buzzer sound URL for current player!');
    }
  }, [state.currentPlayer, fixAttempted]);

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
        
        {/* Add debug controls */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-semibold">Buzzer Troubleshooting:</h3>
          <p className="text-sm mb-2">
            If your buzzer is not working, try the button below to force assignment.
          </p>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleFixBuzzer}
            className="w-full"
          >
            Fix My Buzzer
          </Button>
          <p className="text-xs mt-2">
            Status: {fixAttempted ? 'Fix attempted' : 'No fix attempted yet'}
          </p>
        </div>
        
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
