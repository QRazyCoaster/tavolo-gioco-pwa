
import { supabase } from '@/supabaseClient';
import { listBuzzers } from '@/actions/listBuzzers';

export async function joinGame({ gameId, playerName }) {
  try {
    console.log('Joining game with ID:', gameId);
    console.log('Player name:', playerName);
    
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
      console.error('Error inserting player:', error);
      throw error;
    }
    
    console.log('Player inserted:', player);

    // 2. elenco di tutti i suoni nel bucket
    let buzzerSound = null;
    try {
      const files = await listBuzzers();
      console.log('Buzzers fetched:', files ? files.length : 0);
      
      if (files && files.length > 0) {
        const allURLs = files.map(f =>
          supabase.storage.from('audio')
            .getPublicUrl(`buzzers/${f.name}`).data.publicUrl
        );
        console.log('Available buzzer URLs:', allURLs.length);

        // 3. suoni già usati in questa partita
        const { data: usedRows, error: usedError } = await supabase
          .from('players')
          .select('buzzer_sound_url')
          .eq('game_id', gameId)
          .not('buzzer_sound_url', 'is', null);
          
        if (usedError) {
          console.error('Error fetching used buzzers:', usedError);
        }

        const used = usedRows?.map(r => r.buzzer_sound_url) || [];
        console.log('Used buzzers:', used);
        
        const available = allURLs.filter(u => !used.includes(u));
        console.log('Available buzzers after filtering:', available.length);

        // Assegna un suono solo se ce ne sono disponibili
        if (available.length > 0) {
          buzzerSound = available[Math.floor(Math.random() * available.length)];
        } else if (allURLs.length > 0) {
          buzzerSound = allURLs[Math.floor(Math.random() * allURLs.length)];
        }
        console.log('Chosen buzzer:', buzzerSound);

        // 4. aggiorna la riga del giocatore con il suono scelto (solo se ne abbiamo trovato uno)
        if (buzzerSound) {
          const { error: updateError } = await supabase
            .from('players')
            .update({ buzzer_sound_url: buzzerSound })
            .eq('id', player.id);
            
          if (updateError) {
            console.error('Error updating player with buzzer:', updateError);
          } else {
            console.log('Player buzzer sound updated successfully');
          }
        }
      } else {
        console.warn('No buzzer sounds found!');
      }
    } catch (buzzErr) {
      console.error('Error assigning buzzer sound:', buzzErr);
      // Continuare anche se fallisce l'assegnazione del suono
    }

    return { 
      ...player, 
      isHost: player.is_host === true,
      buzzer_sound_url: buzzerSound 
    };
  } catch (error) {
    console.error('Join game error:', error);
    throw error;
  }
}
