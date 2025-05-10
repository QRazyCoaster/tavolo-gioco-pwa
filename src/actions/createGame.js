import { supabase } from '@/supabaseClient';
import { listBuzzers } from '@/actions/listBuzzers';

export async function createGame({ gameType, hostName }) {
  // 1. crea la partita (pin_code si genera da solo)
  const { data: game, error: gErr } = await supabase
    .from('games')
    .insert({
      game_type: gameType,
      host_name: hostName,
      status: 'waiting'
    })
    .select()          // ← AGGIUNGI
    .single();
  if (gErr) throw gErr;

  // 2. inserisci l'host come primo player
  const { data: player, error: pErr } = await supabase
    .from('players')
    .insert({
      game_id: game.id,
      name: hostName,
      is_host: true,
      narrator_order: 1
    })
    .select()          // ← AGGIUNGI
    .single();
  if (pErr) throw pErr;

  // 3. assegna un suono buzzer all'host
  const files = await listBuzzers();
  const allURLs = files.map(f =>
    supabase.storage.from('audio')
      .getPublicUrl(`buzzers/${f.name}`).data.publicUrl
  );
  const chosen = allURLs[Math.floor(Math.random() * allURLs.length)];

  await supabase
    .from('players')
    .update({ buzzer_sound_url: chosen })
    .eq('id', player.id);

  return { game, hostPlayer: { ...player, buzzer_sound_url: chosen } };
}



