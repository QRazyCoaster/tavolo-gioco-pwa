
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
    let files = [];
    try {
      files = await listBuzzers();
      console.log('Buzzers fetched:', files.length);
    } catch (err) {
      console.error('Error fetching buzzers:', err);
      // Continuare anche se non riesce a caricare i suoni
    }
    
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
      // Continuare anche se fallisce
    }

    const used = usedRows?.map(r => r.buzzer_sound_url) || [];
    const available = allURLs.filter(u => !used.includes(u));
    console.log('Available buzzers after filtering:', available.length);

    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    let chosen = null;
    
    // Assegna un suono solo se ce ne sono disponibili
    if (available.length) {
      chosen = pick(available);
    } else if (allURLs.length) {
      chosen = pick(allURLs);
    }
    console.log('Chosen buzzer:', chosen);

    // 4. aggiorna la riga del giocatore con il suono scelto (solo se ne abbiamo trovato uno)
    if (chosen) {
      const { error: updateError } = await supabase
        .from('players')
        .update({ buzzer_sound_url: chosen })
        .eq('id', player.id);
        
      if (updateError) {
        console.error('Error updating player with buzzer:', updateError);
        // Continuare anche se fallisce l'aggiornamento
      }
    }

    return { 
      ...player, 
      isHost: player.is_host === true, // Conversione esplicita a boolean
      buzzer_sound_url: chosen 
    };
  } catch (error) {
    console.error('Join game error:', error);
    throw error;
  }
}
