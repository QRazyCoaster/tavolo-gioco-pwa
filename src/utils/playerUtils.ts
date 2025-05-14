
/**
 * Helper function to log player data for debugging
 */
export const logPlayerData = (player: any, source: string) => {
  console.log(`[${source}] Player data:`, player);
  console.log(`[${source}] Player buzzer URL:`, player.buzzer_sound_url);
  
  if (!player.buzzer_sound_url) {
    console.warn(`[${source}] WARNING: No buzzer URL for player`);
  }
};

/**
 * Debug and fix buzzer assignment issues for a player
 */
export const checkAndFixBuzzer = async (supabase: any, player: any, setFunction?: Function) => {
  if (!player?.id) {
    console.error('[BUZZER_FIX] No player ID available');
    return false;
  }
  
  console.log('[BUZZER_FIX] Checking buzzer for player:', player.id);
  
  // Check if player has buzzer_sound_url in DB
  const { data, error } = await supabase
    .from('players')
    .select('buzzer_sound_url, name')
    .eq('id', player.id)
    .single();
    
  if (error) {
    console.error('[BUZZER_FIX] Error checking player buzzer:', error);
    return false;
  }
  
  console.log('[BUZZER_FIX] DB check - Player:', data?.name);
  console.log('[BUZZER_FIX] DB check - Player buzzer URL:', data?.buzzer_sound_url);
  
  // If buzzer found in DB but not in state, update state
  if (data?.buzzer_sound_url && !player.buzzer_sound_url) {
    console.log('[BUZZER_FIX] Buzzer found in DB but missing in state, updating state');
    
    const updatedPlayer = {
      ...player,
      buzzer_sound_url: data.buzzer_sound_url
    };
    
    if (setFunction) {
      setFunction(updatedPlayer);
    }
    console.log('[BUZZER_FIX] Updated player with DB buzzer:', updatedPlayer);
    return { success: true, updatedPlayer };
  }
  
  // If no buzzer found, assign one directly
  if (!data?.buzzer_sound_url) {
    console.log('[BUZZER_FIX] No buzzer found for player, attempting to fix...');
    const baseUrl = 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/buzzers/';
    
    // Get a list of available sounds with their actual filenames
    const { data: files, error: listError } = await supabase
      .storage
      .from('audio')
      .list('buzzers');
      
    if (listError || !files || files.length === 0) {
      console.error('[BUZZER_FIX] Could not fetch buzzer sounds:', listError);
      return false;
    }
    
    console.log('[BUZZER_FIX] Available buzzer sounds:', files.map(f => f.name));
    
    // Pick a random sound from the actual files
    const randomSound = files[Math.floor(Math.random() * files.length)];
    // Use encodeURIComponent to handle special characters in filenames
    const buzzerUrl = baseUrl + encodeURIComponent(randomSound.name);
    console.log('[BUZZER_FIX] Assigning new buzzer URL:', buzzerUrl);
    
    // Update the player record
    const { data: updateData, error: updateError } = await supabase
      .from('players')
      .update({ buzzer_sound_url: buzzerUrl })
      .eq('id', player.id)
      .select();
      
    if (updateError) {
      console.error('[BUZZER_FIX] Error updating buzzer URL:', updateError);
      return false;
    } else {
      console.log('[BUZZER_FIX] Buzzer URL updated successfully:', updateData);
      
      // Update the player in state if setFunction provided
      if (updateData && updateData[0] && setFunction) {
        const updatedPlayer = {
          ...player,
          buzzer_sound_url: buzzerUrl
        };
        console.log('[BUZZER_FIX] Updating player with new buzzer:', updatedPlayer);
        setFunction(updatedPlayer);
        
        // Final verification
        const { data: verifyData } = await supabase
          .from('players')
          .select('buzzer_sound_url')
          .eq('id', player.id)
          .single();
        
        console.log('[BUZZER_FIX] Final verification - DB buzzer URL:', verifyData?.buzzer_sound_url);
        return { success: true, updatedPlayer };
      }
      return { success: true };
    }
  }
  
  return false;
};
