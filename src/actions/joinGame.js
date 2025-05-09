import { supabase } from '@/supabaseClient';
import { listBuzzers } from '@/actions/listBuzzers'
export async function joinGame({ gameId, playerName }) {
  const { data: player, error } = await supabase
    .from('players')
    .insert({
      game_id: gameId,
      name: playerName,
      is_host: false
    })
    .single();
  if (error) throw error;
