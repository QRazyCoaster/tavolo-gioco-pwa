
import { supabase } from '@/supabaseClient';
import { listBuzzers } from '@/actions/listBuzzers';

export async function createGame({ gameType, hostName }) {
  try {
    console.log('[CREATE_GAME] Creating game with type:', gameType);
    console.log('[CREATE_GAME] Host name:', hostName);
    
    // 1. crea la partita (pin_code si genera da solo)
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

    // 2. inserisci l'host come primo player
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

    // 3. assegna un suono buzzer all'host
    let buzzerSound = null;
    try {
      const files = await listBuzzers();
      console.log('[CREATE_GAME] Buzzers available:', files.length);
      
      if (files && files.length > 0) {
        // Utilizziamo l'URL hardcoded per garantire la corretta formattazione
        const baseUrl = 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/buzzers/';
        
        // Logging individual files for debugging
        console.log('[CREATE_GAME] All buzzer files:', files.map(f => f.name));
        
        // Costruiamo gli URL completi
        const allURLs = files.map(f => baseUrl + f.name);
        console.log('[CREATE_GAME] All possible buzzer URLs:', allURLs);
        
        // Assegnazione diretta dall'array di URL
        buzzerSound = allURLs[Math.floor(Math.random() * allURLs.length)];
        console.log('[CREATE_GAME] Selected buzzer for host:', buzzerSound);
        
        // Test URL validity
        try {
          const testAudio = new Audio();
          testAudio.addEventListener('error', () => {
            console.error('[CREATE_GAME] TEST: Buzzer URL is not valid:', buzzerSound);
          });
          testAudio.src = buzzerSound;
        } catch (audioErr) {
          console.error('[CREATE_GAME] Error testing audio URL:', audioErr);
        }
        
        // Aggiorna il player con il suono scelto - USING DIRECT UPDATE
        console.log('[CREATE_GAME] Updating player with buzzer URL:', { 
          playerId: player.id, 
          buzzerSound 
        });
        
        const { data: updateData, error: updateErr } = await supabase
          .from('players')
          .update({ buzzer_sound_url: buzzerSound })
          .eq('id', player.id)
          .select();
          
        if (updateErr) {
          console.error('[CREATE_GAME] Error updating host buzzer sound:', updateErr);
        } else {
          console.log('[CREATE_GAME] Host buzzer sound updated successfully:', updateData);
          
          // Verifica se l'aggiornamento è avvenuto correttamente
          const { data: checkData } = await supabase
            .from('players')
            .select('buzzer_sound_url')
            .eq('id', player.id)
            .single();
          console.log('[CREATE_GAME] Verification - buzzer URL in DB:', checkData?.buzzer_sound_url);
          
          // Set the buzzer sound for our return value to match the database
          buzzerSound = checkData?.buzzer_sound_url || buzzerSound;
        }
      } else {
        console.warn('[CREATE_GAME] No buzzer sounds found!');
      }
    } catch (buzzErr) {
      console.error('[CREATE_GAME] Error assigning buzzer sound:', buzzErr);
      // Continuiamo anche se fallisce l'assegnazione del suono
    }

    // Assicurarci che is_host sia convertito a isHost per il frontend
    // e che buzzer_sound_url sia disponibile
    return { 
      game, 
      hostPlayer: { 
        ...player, 
        isHost: player.is_host === true,
        buzzer_sound_url: buzzerSound // Assicuriamoci di passare il buzzer URL al frontend
      } 
    };
  } catch (error) {
    console.error('[CREATE_GAME] Create game error:', error);
    throw error;
  }
}
