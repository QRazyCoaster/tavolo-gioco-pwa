import { supabase } from '@/supabaseClient';
import { generateGamePin } from '@/utils/gameUtils';
import { listBuzzers } from './listBuzzers';
import { getBuzzerUrl } from '@/utils/buzzerUtils';

export async function createGame({ gameType, hostName }) {
  console.log('[CREATE_GAME] Starting game creation');
  // 1) Generate PIN
  const pinCode = generateGamePin();

  // 2) Insert game
  const { data: game, error } = await supabase
    .from('games')
    .insert({
      pin_code: pinCode,
      status: 'waiting',
      game_type: gameType
    })
    .select()
    .single();
  if (error) throw error;
  console.log('[CREATE_GAME] Game created:', game);

  // 3) Create host _with_ narrator_order = 1
  const { data: host, error: hostError } = await supabase
    .from('players')
    .insert({
      game_id: game.id,
      name: hostName,
      is_host: true,
      narrator_order: 1       // ≤ set host order
    })
    .select()
    .single();
  if (hostError) throw hostError;
  console.log('[CREATE_GAME] Host player created with narrator_order=1:', host);

  // 4) Assign buzzer sound (unchanged)…
  let hostBuzzerSound = null;
  try {
    const files = await listBuzzers();
    if (files.length) {
      const randomFile = files[Math.floor(Math.random() * files.length)];
      hostBuzzerSound = getBuzzerUrl(randomFile.name);
      await supabase
        .from('players')
        .update({ buzzer_sound_url: hostBuzzerSound })
        .eq('id', host.id);
      console.log('[CREATE_GAME] Host buzzer sound updated');
    }
  } catch (buzzErr) {
    console.error('[CREATE_GAME] Error assigning buzzer sound:', buzzErr);
  }

  return {
    game,
    hostPlayer: {
      id: host.id,
      name: host.name,
      isHost: host.is_host,
      score: host.score || 0,
      buzzer_sound_url: hostBuzzerSound
    }
  };
}
