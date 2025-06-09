// src/utils/gameEndUtils.ts

import { supabase } from '@/supabaseClient';

/**
 * Sets a game's status to 'completed' in the database
 * This allows the PIN to be reused for new games
 */
export const markGameAsCompleted = async (gameId: string): Promise<void> => {
  try {
    console.log('[GAME_END] Marking game as completed:', gameId);
    
    const { error } = await supabase
      .from('games')
      .update({ status: 'completed' })
      .eq('id', gameId);
    
    if (error) {
      console.error('[GAME_END] Error marking game as completed:', error);
      throw error;
    }
    
    console.log('[GAME_END] Game successfully marked as completed');
  } catch (error) {
    console.error('[GAME_END] Failed to mark game as completed:', error);
    // Don't throw the error to avoid breaking the UI flow
    // The game will still end locally even if the database update fails
  }
};