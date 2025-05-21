aimport { supabase } from '@/supabaseClient';
import { listBuzzers } from '@/actions/listBuzzers';
import { getBuzzerUrl } from '@/utils/buzzerUtils';

export async function joinGame({ gameId, playerName }) {
  console.log('[JOIN_GAME] Joining game:', gameId, playerName);

  // 1) Figure out the next narrator_order
  let nextOrder = 1;
  try {
    // fetch the highest existing narrator_order for this game
    const { data: last, error: lastError } = await supabase
      .from('players')
      .select('narrator_order')
      .eq('game_id', gameId)
      .order('narrator_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastError && lastError.code !== 'PGRST116') {
      console.error('[JOIN_GAME] Error getting last narrator_order:', lastError);
    } else if (last?.narrator_order != null) {
      nextOrder = last.narrator_order + 1;
    }
  } catch (err) {
    console.error('[JOIN_GAME] Exception fetching narrator_order:', err);
  }
  console.log('[JOIN_GAME] Assigned narrator_order:', nextOrder);

  // 2) Insert the new player with that order
  const { data: player, error } = await supabase
    .from('players')
    .insert({
      game_id: gameId,
      name: playerName,
      is_host: false,
      narrator_order: nextOrder   // ≤ set the joiner’s order
    })
    .select()
    .single();
  if (error) throw error;
  console.log('[JOIN_GAME] Supabase returned player row:', player);
  console.log('[JOIN_GAME] Player inserted:', player);

  // 3) Assign buzzer sound (unchanged)…
  let buzzerSound = null;
  try {
    const files = await listBuzzers();
    const usedRows = await supabase
      .from('players')
      .select('buzzer_sound_url')
      .eq('game_id', gameId)
      .not('buzzer_sound_url', 'is', null);
    const usedUrls = usedRows.data?.map(r => r.buzzer_sound_url) || [];
    const usedNames = usedUrls.map(url => decodeURIComponent(url.split('/').pop()));
    const available = files.filter(f => !usedNames.includes(f.name));
    const pick = (available.length ? available : files)[Math.floor(Math.random() * files.length)];
    buzzerSound = getBuzzerUrl(pick.name);
    await supabase
      .from('players')
      .update({ buzzer_sound_url: buzzerSound })
      .eq('id', player.id);
    console.log('[JOIN_GAME] Player buzzer sound updated');
  } catch (buzzErr) {
    console.error('[JOIN_GAME] Error assigning buzzer sound:', buzzErr);
  }

  return {
    ...player,
    isHost: player.is_host,
    buzzer_sound_url: buzzerSound
  };
}
