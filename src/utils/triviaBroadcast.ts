
import { RealtimeChannel } from '@supabase/supabase-js';
import { Player } from '@/context/GameContext';
import { MIN_SCORE_LIMIT } from './triviaConstants';
import { supabase } from '@/supabaseClient';

// ─────────────────────────────────────────────────────────────
//  Shared broadcast channel (singleton)
// ─────────────────────────────────────────────────────────────
let gameChannel: RealtimeChannel | null = null;
let activeSubscriptions: string[] = [];

export const setGameChannel = (channel: RealtimeChannel) => {
  // Clean up existing channel if there is one
  if (gameChannel) {
    console.log('[triviaBroadcast] Replacing existing game channel');
    try {
      supabase.removeChannel(gameChannel);
    } catch (e) {
      console.error('[triviaBroadcast] Error removing existing channel:', e);
    }
  }
  gameChannel = channel;
  console.log('[triviaBroadcast] Game channel set');
};

export const getGameChannel = () => gameChannel;

export const cleanupChannel = () => {
  console.log('[triviaBroadcast] Cleaning up game channel and subscriptions');
  if (gameChannel) {
    try {
      supabase.removeChannel(gameChannel);
    } catch (e) {
      console.error('[triviaBroadcast] Error removing channel during cleanup:', e);
    }
  }
  gameChannel = null;
  activeSubscriptions = [];
};

export const broadcastScoreUpdate = (players: Player[], timestamp = Date.now()) => {
  if (!gameChannel) {
    console.error('[triviaBroadcast] Cannot broadcast score update - game channel not set');
    return;
  }
  
  // Get current scores from game state, ensuring we respect the minimum score limit
  const scores = players.map(p => ({ 
    id: p.id, 
    score: Math.max(MIN_SCORE_LIMIT, p.score || 0)
  }));
  console.log('[triviaBroadcast] Broadcasting score update to all clients:', scores, 'with timestamp:', timestamp);
  
  // Send score updates to all players with high priority
  return new Promise((resolve, reject) => {
    gameChannel.send({
      type: 'broadcast',
      event: 'SCORE_UPDATE',
      payload: { scores, timestamp } // Use the provided timestamp for consistency
    }).then(() => {
      console.log('[triviaBroadcast] Score update broadcast sent successfully');
      
      // Send multiple confirmation updates to ensure clients receive it
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          if (gameChannel) {
            gameChannel.send({
              type: 'broadcast',
              event: 'SCORE_UPDATE',
              payload: { scores, timestamp: timestamp + i + 1 }
            }).then(() => {
              console.log('[triviaBroadcast] Score update confirmation sent #' + (i+1));
            }).catch(e => {
              console.error('[triviaBroadcast] Error sending confirmation update:', e);
            });
          }
        }, 800 * (i + 1));
      }
      
      resolve(true);
    }).catch(error => {
      console.error('[triviaBroadcast] Error broadcasting score update:', error);
      reject(error);
    });
  });
};

export const broadcastNextQuestion = (
  nextIndex: number,
  players: Player[],
  scores?: { id: string; score: number }[],
  timestamp = Date.now()
) => {
  if (!gameChannel) {
    console.error('[triviaBroadcast] Cannot broadcast next question - game channel not set');
    return;
  }
  
  // Use provided scores or get current scores from game state, applying minimum score limit
  const payloadScores = scores 
    ? scores.map(s => ({ id: s.id, score: Math.max(MIN_SCORE_LIMIT, s.score) }))
    : players.map(p => ({ id: p.id, score: Math.max(MIN_SCORE_LIMIT, p.score || 0) }));
    
  console.log('[triviaBroadcast] Broadcasting next question with scores:', payloadScores, 'with timestamp:', timestamp);
  
  // Send next question event to all players with the timestamp
  return gameChannel.send({
    type: 'broadcast',
    event: 'NEXT_QUESTION',
    payload: { questionIndex: nextIndex, scores: payloadScores, timestamp }
  }).then(() => {
    console.log('[triviaBroadcast] Next question broadcast sent successfully');
    
    // Send a confirmation broadcast after a delay to ensure everyone gets it
    setTimeout(() => {
      if (gameChannel) {
        gameChannel.send({
          type: 'broadcast',
          event: 'NEXT_QUESTION',
          payload: { questionIndex: nextIndex, scores: payloadScores, timestamp: timestamp + 1 }
        }).catch(e => {
          console.error('[triviaBroadcast] Error sending next question confirmation:', e);
        });
      }
    }, 1000);
    
    return true;
  }).catch(error => {
    console.error('[triviaBroadcast] Error broadcasting next question:', error);
    throw error;
  });
};

export const broadcastRoundEnd = (
  currentRoundNumber: number,
  nextNarratorId: string,
  players: Player[],
  isGameOver = false,
  timestamp = Date.now()
) => {
  if (!gameChannel) {
    console.error('[triviaBroadcast] Cannot broadcast round end - game channel not set');
    return;
  }
  
  // Get current scores from game state, applying minimum score limit
  const scores = players.map(p => ({ 
    id: p.id, 
    score: Math.max(MIN_SCORE_LIMIT, p.score || 0) 
  }));
  
  // Find the next narrator player object
  const nextNarratorPlayer = nextNarratorId ? players.find(p => p.id === nextNarratorId) : null;
  const nextNarratorName = nextNarratorPlayer?.name || '';
  
  console.log(
    `[triviaBroadcast] Broadcasting round end with new narrator: ${nextNarratorId} (${nextNarratorName}), game over: ${isGameOver}, timestamp: ${timestamp}`
  );
  
  // Send round end event to all players
  return gameChannel.send({
    type: 'broadcast',
    event: 'ROUND_END',
    payload: { 
      nextRound: currentRoundNumber + 1,
      nextNarratorId,
      scores,
      isGameOver,
      nextNarratorName, // Add narrator name to payload
      timestamp
    }
  }).then(() => {
    console.log('[triviaBroadcast] Round end broadcast sent successfully');
    
    // Update the database with the next narrator info
    if (!isGameOver && nextNarratorId) {
      // Find the next narrator player
      if (nextNarratorPlayer && nextNarratorPlayer.name) {
        console.log(`[triviaBroadcast] Updating database with new narrator: ${nextNarratorPlayer.name} for round ${currentRoundNumber + 1}`);
        
        return supabase
          .from('games')
          .update({ 
            current_round: currentRoundNumber + 1,
            current_narrator_id: nextNarratorId,  // Add the narrator ID
            host_name: nextNarratorPlayer.name    // Update host_name to the next narrator
          })
          .eq('id', sessionStorage.getItem('gameId'))
          .then(({ error }) => {
            if (error) {
              console.error('[triviaBroadcast] Error updating game with new narrator:', error);
              return false;
            } else {
              console.log('[triviaBroadcast] Successfully updated current_round and host_name in database');
              return true;
            }
          });
      }
    }
    return true;
  }).catch(error => {
    console.error('[triviaBroadcast] Error broadcasting round end:', error);
    throw error;
  });
};
