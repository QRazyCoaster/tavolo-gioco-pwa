// src/actions/joinGame.js

import { supabase } from '@/supabaseClient';
import { listBuzzers } from '@/actions/listBuzzers';
import { getBuzzerUrl } from '@/utils/buzzerUtils';

export async function joinGame({ gameId, playerName }) {
  console.log('[JOIN_GAME] Joining game with ID:', gameId);
  console.log('[JOIN_GAME] Player name:', playerName);
  
  // ─── 1) DETERMINE NEXT narrator_order ──────────────────
  let nextOrder = 1;
  try {
    const { data: last, error: lastError } = await supabase
      .from('players')
      .select('narrator_order')
      .eq('game_id', gameId)
      .order('narrator_order', { ascending: false })
      .limit(1)
      .maybeSingle();          // ← get the highest existing order, if any

    if (lastError) {
      console.error('[JOIN_GAME] Error fetching last narrator_order:', lastError);
    } else if (last && last.narrator_order != null) {
      nextOrder = last.narrator_order + 1;
    }
  } catch (err) {
    console.error('[JOIN_GAME] Exception fetching narrator_order:', err);
  }
  console.log('[JOIN_GAME] Assigned narrator_order:', nextOrder);
  // ───────────────────────────────────────────────────────

  // ─── 2) VERIFY GAME STATUS BEFORE INSERTING PLAYER ─────
  try {
    const { data: gameCheck, error: gameCheckError } = await supabase
      .from('games')
      .select('status')
      .eq('id', gameId)
      .single();

    if (gameCheckError || !gameCheck) {
      console.error('[JOIN_GAME] Error checking game status:', gameCheckError);
      throw new Error('Game not found');
    }

    if (gameCheck.status !== 'waiting') {
      console.error('[JOIN_GAME] Game is not accepting players. Status:', gameCheck.status);
      throw new Error(gameCheck.status === 'active' ? 'Game has already started' : 'Game is no longer available');
    }
  } catch (err) {
    console.error('[JOIN_GAME] Game status check failed:', err);
    throw err;
  }

  // ─── 3) INSERT NEW PLAYER with narrator_order ─────────
  const { data: player, error: insertError } = await supabase
    .from('players')
    .insert({
      game_id: gameId,
      name: playerName,
      is_host: false,

      // ─── ADD THIS LINE ───────────────────────────────────
      narrator_order: nextOrder   // ← assign the computed order here
      // ─────────────────────────────────────────────────────
    })
    .select()
    .single();
    
  if (insertError) {
    console.error('[JOIN_GAME] Error inserting player:', insertError);
    throw insertError;
  }

  // ─── INSERT DEBUG LOG HERE ────────────────────────────
  // This will show you exactly what Supabase returned,
  // including the narrator_order field.
  console.log('[JOIN_GAME] Supabase returned player row:', player);
  // ───────────────────────────────────────────────────────

  console.log('[JOIN_GAME] Player inserted:', player);

  // ─── 4) ASSIGN BUZZER SOUND (unchanged) ───────────────
  let buzzerSound = null;
  try {
    const files = await listBuzzers();
    if (files && files.length > 0) {
      // Find which sounds are already in use:
      const { data: usedRows } = await supabase
        .from('players')
        .select('buzzer_sound_url')
        .eq('game_id', gameId)
        .not('buzzer_sound_url', 'is', null);

      const usedNames = (usedRows || []).map(r => {
        if (!r.buzzer_sound_url) return '';
        return decodeURIComponent(r.buzzer_sound_url.split('/').pop());
      });

      // Pick an unused file if possible
      const available = files.filter(f => !usedNames.includes(f.name));
      const pick = (available.length ? available : files)[Math.floor(Math.random() * files.length)];
      
      console.log('[JOIN_GAME] Selected buzzer file:', pick.name);
      buzzerSound = getBuzzerUrl(pick.name);

      await supabase
        .from('players')
        .update({ buzzer_sound_url: buzzerSound })
        .eq('id', player.id);

      console.log('[JOIN_GAME] Player buzzer sound updated');
    }
  } catch (buzzErr) {
    console.error('[JOIN_GAME] Error assigning buzzer sound:', buzzErr);
  }

  return { 
    ...player, 
    isHost: player.is_host === true,
    buzzer_sound_url: buzzerSound
  };
}
