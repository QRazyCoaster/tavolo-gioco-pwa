import { supabase } from '@/supabaseClient';
import { listBuzzers } from '@/actions/listBuzzers';

export async function joinGame({ gameId, playerName }) {
  // 1. inserisci il giocatore
  const { data: player, error } = await supabase
    .from('players')
    .insert({
      game_id: gameId,
      name: playerName,
      is_host: false
    })
    .single();
  if (error) throw error;

  // (prossimo passo: assegneremo il suono qui)

  return player;          // ritorna la riga appena creata
}
