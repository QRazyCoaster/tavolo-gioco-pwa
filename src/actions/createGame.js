
import { supabase } from '@/supabaseClient';
import { listBuzzers } from '@/actions/listBuzzers';

export async function createGame({ gameType, hostName }) {
  try {
    console.log('Creating game with type:', gameType);
    console.log('Host name:', hostName);
    
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
    
    console.log('Game created:', game);

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
    
    console.log('Host player created:', player);

    // 3. assegna un suono buzzer all'host
    let buzzerSound = null;
    try {
      const files = await listBuzzers();
      console.log('Buzzers available:', files.length);
      
      if (files && files.length > 0) {
        const allURLs = files.map(f =>
          supabase.storage.from('audio')
            .getPublicUrl(`buzzers/${f.name}`).data.publicUrl
        );
        console.log('Buzzer URLs:', allURLs);
        
        buzzerSound = allURLs[Math.floor(Math.random() * allURLs.length)];
        console.log('Selected buzzer for host:', buzzerSound);
        
        // Aggiorna il player con il suono scelto
        const { error: updateErr } = await supabase
          .from('players')
          .update({ buzzer_sound_url: buzzerSound })
          .eq('id', player.id);
          
        if (updateErr) {
          console.error('Error updating host buzzer sound:', updateErr);
        } else {
          console.log('Host buzzer sound updated successfully');
        }
      } else {
        console.warn('No buzzer sounds found!');
      }
    } catch (buzzErr) {
      console.error('Error assigning buzzer sound:', buzzErr);
      // Continuiamo anche se fallisce l'assegnazione del suono
    }

    // Assicurarci che is_host sia convertito a isHost per il frontend
    return { 
      game, 
      hostPlayer: { 
        ...player, 
        isHost: player.is_host === true,
        buzzer_sound_url: buzzerSound 
      } 
    };
  } catch (error) {
    console.error('Create game error:', error);
    throw error;
  }
}
