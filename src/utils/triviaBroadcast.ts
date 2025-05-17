
import { RealtimeChannel } from '@supabase/supabase-js';
import { Player } from '@/context/GameContext';

// ─────────────────────────────────────────────────────────────
//  Shared broadcast channel (singleton)
// ─────────────────────────────────────────────────────────────
let gameChannel: RealtimeChannel | null = null;

export const setGameChannel = (channel: RealtimeChannel) => {
  gameChannel = channel;
  console.log('[triviaBroadcast] Game channel set');
};

export const getGameChannel = () => gameChannel;

export const broadcastScoreUpdate = (players: Player[]) => {
  if (!gameChannel) {
    console.error('[triviaBroadcast] Cannot broadcast score update - game channel not set');
    return;
  }
  
  // Get current scores from game state
  const scores = players.map(p => ({ id: p.id, score: p.score || 0 }));
  console.log('[triviaBroadcast] Broadcasting score update to all clients:', scores);
  
  // Send score updates to all players
  gameChannel.send({
    type: 'broadcast',
    event: 'SCORE_UPDATE',
    payload: { scores }
  }).then(() => {
    console.log('[triviaBroadcast] Score update broadcast sent successfully');
  }).catch(error => {
    console.error('[triviaBroadcast] Error broadcasting score update:', error);
  });
};

export const broadcastNextQuestion = (
  nextIndex: number,
  players: Player[],
  scores?: { id: string; score: number }[]
) => {
  if (!gameChannel) {
    console.error('[triviaBroadcast] Cannot broadcast next question - game channel not set');
    return;
  }
  
  // Use provided scores or get current scores from game state
  const payloadScores = scores ?? players.map(p => ({ id: p.id, score: p.score || 0 }));
  console.log('[triviaBroadcast] Broadcasting next question with scores:', payloadScores);
  
  // Send next question event to all players
  gameChannel.send({
    type: 'broadcast',
    event: 'NEXT_QUESTION',
    payload: { questionIndex: nextIndex, scores: payloadScores }
  }).then(() => {
    console.log('[triviaBroadcast] Next question broadcast sent successfully');
  }).catch(error => {
    console.error('[triviaBroadcast] Error broadcasting next question:', error);
  });
};

export const broadcastRoundEnd = (
  currentRoundNumber: number,
  nextNarratorId: string,
  players: Player[]
) => {
  if (!gameChannel) {
    console.error('[triviaBroadcast] Cannot broadcast round end - game channel not set');
    return;
  }
  
  // Get current scores from game state
  const scores = players.map(p => ({ id: p.id, score: p.score || 0 }));
  console.log('[triviaBroadcast] Broadcasting round end with new narrator:', nextNarratorId);
  
  // Send round end event to all players
  gameChannel.send({
    type: 'broadcast',
    event: 'ROUND_END',
    payload: { 
      nextRound: currentRoundNumber + 1,
      nextNarratorId,
      scores
    }
  }).then(() => {
    console.log('[triviaBroadcast] Round end broadcast sent successfully');
  }).catch(error => {
    console.error('[triviaBroadcast] Error broadcasting round end:', error);
  });
};
