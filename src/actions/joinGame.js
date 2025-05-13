
import { supabase } from '@/supabaseClient';
import { listBuzzers } from '@/actions/listBuzzers';

export async function joinGame({ gameId, playerName }) {
  try {
    console.log('[JOIN_GAME] Joining game with ID:', gameId);
    console.log('[JOIN_GAME] Player name:', playerName);
    
    // 1. inserisci il giocatore
    const { data: player, error } = await supabase
      .from('players')
      .insert({
        game_id: gameId,
        name: playerName,
        is_host: false
      })
      .select()
      .single();
      
    if (error) {
      console.error('[JOIN_GAME] Error inserting player:', error);
      throw error;
    }
    
    console.log('[JOIN_GAME] Player inserted:', player);

    // 2. elenco di tutti i suoni nel bucket
    let buzzerSound = null;
    try {
      const files = await listBuzzers();
      console.log('[JOIN_GAME] Buzzers fetched:', files ? files.length : 0);
      
      if (files && files.length > 0) {
        // Utilizziamo l'URL hardcoded per garantire la corretta formattazione
        const baseUrl = 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/buzzers/';
        
        // Logging individual files with their actual names for debugging
        console.log('[JOIN_GAME] All actual buzzer files:', files.map(f => f.name));

        // 3. suoni già usati in questa partita
        const { data: usedRows, error: usedError } = await supabase
          .from('players')
          .select('buzzer_sound_url')
          .eq('game_id', gameId)
          .not('buzzer_sound_url', 'is', null);
          
        if (usedError) {
          console.error('[JOIN_GAME] Error fetching used buzzers:', usedError);
        }

        const used = usedRows?.map(r => r.buzzer_sound_url) || [];
        console.log('[JOIN_GAME] Used buzzers:', used);
        
        // Build available buzzer list
        const availableFiles = [];
        for (const file of files) {
          const fileUrl = baseUrl + encodeURIComponent(file.name);
          if (!used.some(u => u === fileUrl)) {
            availableFiles.push(file);
          }
        }
        
        console.log('[JOIN_GAME] Available buzzer files after filtering:', availableFiles.length);

        // Assign a sound
        let selectedFile;
        if (availableFiles.length > 0) {
          selectedFile = availableFiles[Math.floor(Math.random() * availableFiles.length)];
        } else {
          selectedFile = files[Math.floor(Math.random() * files.length)];
        }
        
        console.log('[JOIN_GAME] Selected buzzer file:', selectedFile.name);
        
        // Use encodeURIComponent to handle special characters in filenames
        buzzerSound = baseUrl + encodeURIComponent(selectedFile.name);
        console.log('[JOIN_GAME] Full buzzer URL for player:', buzzerSound);

        // Test URL validity
        try {
          const testAudio = new Audio();
          testAudio.addEventListener('error', () => {
            console.error('[JOIN_GAME] TEST: Buzzer URL is not valid:', buzzerSound);
          });
          testAudio.src = buzzerSound;
        } catch (audioErr) {
          console.error('[JOIN_GAME] Error testing audio URL:', audioErr);
        }

        // 4. aggiorna la riga del giocatore con il suono scelto
        console.log('[JOIN_GAME] Updating player with buzzer URL:', { 
          playerId: player.id, 
          buzzerSound 
        });
        
        const { data: updateData, error: updateError } = await supabase
          .from('players')
          .update({ buzzer_sound_url: buzzerSound })
          .eq('id', player.id)
          .select();
          
        if (updateError) {
          console.error('[JOIN_GAME] Error updating player with buzzer:', updateError);
        } else {
          console.log('[JOIN_GAME] Player buzzer sound updated successfully:', updateData);
          
          // Verify if the update was successful
          const { data: checkData } = await supabase
            .from('players')
            .select('buzzer_sound_url')
            .eq('id', player.id)
            .single();
          console.log('[JOIN_GAME] Verification - buzzer URL in DB:', checkData?.buzzer_sound_url);
          
          // Set the buzzer sound for our return value to match the database
          buzzerSound = checkData?.buzzer_sound_url || buzzerSound;
        }
      } else {
        console.warn('[JOIN_GAME] No buzzer sounds found!');
      }
    } catch (buzzErr) {
      console.error('[JOIN_GAME] Error assigning buzzer sound:', buzzErr);
      // Continue even if buzzer sound assignment fails
    }
    
    // Final check of DB before returning
    try {
      const { data: finalCheck } = await supabase
        .from('players')
        .select('buzzer_sound_url')
        .eq('id', player.id)
        .single();
        
      if (finalCheck?.buzzer_sound_url) {
        console.log('[JOIN_GAME] Final DB check found buzzer URL:', finalCheck.buzzer_sound_url);
        buzzerSound = finalCheck.buzzer_sound_url;
      }
    } catch (checkErr) {
      console.error('[JOIN_GAME] Error in final DB check:', checkErr);
    }

    return { 
      ...player, 
      isHost: player.is_host === true,
      buzzer_sound_url: buzzerSound // Ensure buzzer URL is passed to frontend
    };
  } catch (error) {
    console.error('[JOIN_GAME] Join game error:', error);
    throw error;
  }
}
