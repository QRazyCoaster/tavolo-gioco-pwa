import { supabase } from '@/supabaseClient';
import { listBuzzers } from '@/actions/listBuzzers';
import { getBuzzerUrl } from '@/utils/buzzerUtils';   // ⬅️ NEW

export async function createGame({ gameType, hostName }) {
  try {
    console.log('[CREATE_GAME] Creating game with type:', gameType);
    console.log('[CREATE_GAME] Host name:', hostName);
    
    // 1. Create the game (pin_code auto‑generates)
    const { data: game, error: gErr } = await supabase
      .from('games')
      .insert({
        game_type: gameType,
        host_name: hostName,
        status: 'waiting'
      })
      .select()
      .single();
    if (gErr) throw gErr;
    
    console.log('[CREATE_GAME] Game created:', game);

    // 2. Insert the host as first player
    const { data: player, error: pErr } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        name: hostName,
        is_host: true,
        narrator_order: 1
      })
      .select()
      .single();
    if (pErr) throw pErr;
    
    console.log('[CREATE_GAME] Host player created:', player);

    // 3. Assign a buzzer sound to the host
    let buzzerSound = null;
    try {
      const files = await listBuzzers();
      console.log('[CREATE_GAME] Buzzers available:', files.length);
      
      if (files && files.length > 0) {
        // Pick a random file
        const randomFile = files[Math.floor(Math.random() * files.length)];
        console.log('[CREATE_GAME] Selected buzzer file:', randomFile.name);
        
        // NEW: build the public URL the safe way
        buzzerSound = getBuzzerUrl(randomFile.name);
        console.log('[CREATE_GAME] Full buzzer URL for host:', buzzerSound);
        
        // Update the player row
        const { data: updateData, error: updateErr } = await supabase
          .from('players')
          .update({ buzzer_sound_url: buzzerSound })
          .eq('id', player.id)
          .select();
          
        if (updateErr) {
          console.error('[CREATE_GAME] Error updating host buzzer sound:', updateErr);
        } else {
          console.log('[CREATE_GAME] Host buzzer sound updated successfully:', updateData);
        }
      } else {
        console.warn('[CREATE_GAME] No buzzer sounds found!');
      }
    } catch (buzzErr) {
      console.error('[CREATE_GAME] Error assigning buzzer sound:', buzzErr);
    }

    return { 
      game, 
      hostPlayer: { 
        ...player, 
        isHost: player.is_host === true,
        buzzer_sound_url: buzzerSound
      } 
    };
  } catch (error) {
    console.error('[CREATE_GAME] Create game error:', error);
    throw error;
  }
}
