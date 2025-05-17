
import { RealtimeChannel } from '@supabase/supabase-js';
import { Player } from '@/context/GameContext';

// ─────────────────────────────────────────────────────────────
//  Shared broadcast channel (singleton)
// ─────────────────────────────────────────────────────────────
let gameChannel: RealtimeChannel | null = null;

export const setGameChannel = (channel: RealtimeChannel) => {
  gameChannel = channel;
};

export const getGameChannel = () => gameChannel;

export const broadcastScoreUpdate = (players: Player[]) => {
  if (!gameChannel) return;
  
  // Get current scores from game state
  const scores = players.map(p => ({ id: p.id, score: p.score || 0 }));
  console.log('[triviaBroadcast] Broadcasting score update to all clients:', scores);
  
  // Send score updates to all players
  gameChannel.send({
    type: 'broadcast',
    event: 'SCORE_UPDATE',
    payload: { scores }
  });
};

export const broadcastNextQuestion = (
  nextIndex: number,
  players: Player[],
  scores?: { id: string; score: number }[]
) => {
  if (!gameChannel) return;
  
  // Use provided scores or get current scores from game state
  const payloadScores = scores ?? players.map(p => ({ id: p.id, score: p.score || 0 }));
  console.log('[triviaBroadcast] Broadcasting next question with scores:', payloadScores);
  
  // Send next question event to all players
  gameChannel.send({
    type: 'broadcast',
    event: 'NEXT_QUESTION',
    payload: { questionIndex: nextIndex, scores: payloadScores }
  });
};

export const broadcastRoundEnd = (
  currentRoundNumber: number,
  nextNarratorId: string,
  players: Player[]
) => {
  if (!gameChannel) return;
  
  // Get current scores from game state
  const scores = players.map(p => ({ id: p.id, score: p.score || 0 }));
  
  // Send round end event to all players
  gameChannel.send({
    type: 'broadcast',
    event: 'ROUND_END',
    payload: { 
      nextRound: currentRoundNumber + 1,
      nextNarratorId,
      scores
    }
  });
};
