// src/actions/createGame.js

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
        game_type: gameType
      })
      .select()
      .single();
      
    if (error) {
      console.error('[CREATE_GAME] Error creating game:', error);
      throw error;
    }
    
    console.log('[CREATE_GAME] Game created:', game);
    
    // 3. Create a host player, setting narrator_order = 1
    const { data: host, error: hostError } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        name: hostName,
        is_host: true,
        
        // ─── ADD THIS LINE ────────────────────────────────────
        narrator_order: 1,   // ← Assign the host the first narrator_order
        // ─────────────────────────────────────────────────────

      })
      .select()
      .single();
      
    if (hostError) {
      console.error('[CREATE_GAME] Error creating host player:', hostError);
      throw hostError;
    }
    
    // ─── INSERT DEBUG LOG HERE ────────────────────────────
    // This will let us see exactly what Supabase returned,
    // including whether narrator_order actually got set.
    console.log('[CREATE_GAME] Supabase returned host row:', host);
    // ─────────────────────────────────────────────────────

    console.log('[CREATE_GAME] Host player created with narrator_order=1:', host);
    
    // 4. Assign a buzzer sound to the host (unchanged)
    let hostBuzzerSound = null;
    try {
      const files = await listBuzzers();
      if (files && files.length > 0) {
        const randomFile = files[Math.floor(Math.random() * files.length)];
        hostBuzzerSound = getBuzzerUrl(randomFile.name);
        await supabase
          .from('players')
          .update({ buzzer_sound_url: hostBuzzerSound })
          .eq('id', host.id);
        console.log('[CREATE_GAME] Host buzzer sound updated');
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
