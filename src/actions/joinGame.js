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
    .select()
    .single();
  if (error) throw error;

  // 2. elenco di tutti i suoni nel bucket
  const files = await listBuzzers();
  const allURLs = files.map(f =>
    supabase.storage.from('audio')
      .getPublicUrl(`buzzers/${f.name}`).data.publicUrl
  );

  // 3. suoni già usati in questa partita
  const { data: usedRows } = await supabase
    .from('players')
    .select('buzzer_sound_url')
    .eq('game_id', gameId)
    .not('buzzer_sound_url', 'is', null);

  const used = usedRows.map(r => r.buzzer_sound_url);
  const available = allURLs.filter(u => !used.includes(u));

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const chosen = available.length ? pick(available) : pick(allURLs);

  // 4. aggiorna la riga del giocatore con il suono scelto
  await supabase
    .from('players')
    .update({ buzzer_sound_url: chosen })
    .eq('id', player.id);


  return player;          // ritorna la riga appena creata
}
