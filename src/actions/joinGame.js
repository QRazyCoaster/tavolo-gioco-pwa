import { supabase } from '@/supabaseClient';
import { listBuzzers } from '@/actions/listBuzzers';
import { getBuzzerUrl } from '@/utils/buzzerUtils';   // ⬅️ NEW

export async function joinGame({ gameId, playerName }) {
  try {
    console.log('[JOIN_GAME] Joining game with ID:', gameId);
    console.log('[JOIN_GAME] Player name:', playerName);
    
    // 1. Insert the player
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

    // 2. Fetch all buzzer sounds from storage
    let buzzerSound = null;
    try {
      const files = await listBuzzers();
      console.log('[JOIN_GAME] Buzzers fetched:', files ? files.length : 0);
      
      if (files && files.length > 0) {
        // 3. Already‑used sounds in this game
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
        
        // Extract file names from used URLs
        const usedFileNames = used.map(url => {
          if (!url) return '';
          const parts = url.split('/');
          return decodeURIComponent(parts[parts.length - 1]);
        });
        
        console.log('[JOIN_GAME] Used buzzer filenames:', usedFileNames);
        
        // Available buzzers
        const availableFiles = files.filter(file => 
          !usedFileNames.includes(file.name)
        );
        
        console.log('[JOIN_GAME] Available buzzer files after filtering:', availableFiles.length);
        console.log('[JOIN_GAME] Available buzzer filenames:', availableFiles.map(f => f.name));

        // 4. Choose a sound
        let selectedFile;
        if (availableFiles.length > 0) {
          selectedFile = availableFiles[Math.floor(Math.random() * availableFiles.length)];
        } else {
          // All buzzers used → reuse any
          selectedFile = files[Math.floor(Math.random() * files.length)];
        }
        
        console.log('[JOIN_GAME] Selected buzzer file:', selectedFile.name);
        
        // NEW: build the public URL the safe way
        buzzerSound = getBuzzerUrl(selectedFile.name);
        console.log('[JOIN_GAME] Full buzzer URL for player:', buzzerSound);

        // 5. Update the player row with the chosen sound
        const { data: updateData, error: updateError } = await supabase
          .from('players')
          .update({ buzzer_sound_url: buzzerSound })
          .eq('id', player.id)
          .select();
          
        if (updateError) {
          console.error('[JOIN_GAME] Error updating player with buzzer:', updateError);
        } else {
          console.log('[JOIN_GAME] Player buzzer sound updated successfully:', updateData);
        }
      } else {
        console.warn('[JOIN_GAME] No buzzer sounds found!');
      }
    } catch (buzzErr) {
      console.error('[JOIN_GAME] Error assigning buzzer sound:', buzzErr);
    }
    
    return { 
      ...player, 
      isHost: player.is_host === true,
      buzzer_sound_url: buzzerSound
    };
  } catch (error) {
    console.error('[JOIN_GAME] Join game error:', error);
    throw error;
  }
}
