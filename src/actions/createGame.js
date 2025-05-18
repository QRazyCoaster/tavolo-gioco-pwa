
import { supabase } from '@/supabaseClient';
import { generateGamePin } from '@/utils/gameUtils';
import { listBuzzers } from './listBuzzers';
import { getBuzzerUrl } from '@/utils/buzzerUtils';

export async function createGame({ gameType, hostName }) {
  console.log('[CREATE_GAME] Starting game creation');
  console.log('[CREATE_GAME] Host name:', hostName);
  console.log('[CREATE_GAME] Game type:', gameType);
  
  try {
    // 1. Generate a PIN for the game
    const pinCode = generateGamePin();
    
    // 2. Insert a new game record
    const { data: game, error } = await supabase
      .from('games')
      .insert({
        pin_code: pinCode,
        status: 'waiting',
        game_type: gameType,
        host_name: hostName  // Add host_name to the game record
      })
      .select()
      .single();
      
    if (error) {
      console.error('[CREATE_GAME] Error creating game:', error);
      throw error;
    }
    
    console.log('[CREATE_GAME] Game created:', game);
    
    // 3. Create a host player
    const { data: host, error: hostError } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        name: hostName,
        is_host: true
      })
      .select()
      .single();
      
    if (hostError) {
      console.error('[CREATE_GAME] Error creating host player:', hostError);
      throw hostError;
    }
    
    console.log('[CREATE_GAME] Host player created:', host);
    
    // 4. Assign a buzzer sound to the host
    let hostBuzzerSound = null;
    
    try {
      const files = await listBuzzers();
      console.log('[CREATE_GAME] Buzzers:', files ? files.length : 0);
      
      if (files && files.length > 0) {
        const randomFile = files[Math.floor(Math.random() * files.length)];
        console.log('[CREATE_GAME] Selected buzzer:', randomFile.name);
        
        hostBuzzerSound = getBuzzerUrl(randomFile.name);
        
        // Update the host player with the buzzer sound
        const { error: updateError } = await supabase
          .from('players')
          .update({ buzzer_sound_url: hostBuzzerSound })
          .eq('id', host.id);
          
        if (updateError) {
          console.error('[CREATE_GAME] Error updating host buzzer sound:', updateError);
        } else {
          console.log('[CREATE_GAME] Host buzzer sound updated');
        }
      }
    } catch (buzzErr) {
      console.error('[CREATE_GAME] Error assigning buzzer sound:', buzzErr);
    }
    
    return { 
      game, 
      hostPlayer: {
        id: host.id,
        name: host.name,
        isHost: host.is_host === true,
        score: host.score || 0,
        buzzer_sound_url: hostBuzzerSound
      }
    };
    
  } catch (error) {
    console.error('[CREATE_GAME] Error in createGame:', error);
    throw error;
  }
}
