
import { supabase } from '@/supabaseClient';

export async function listBuzzers() {
  try {
    console.log('[LIST_BUZZERS] Listing buzzer sounds from storage...');
    
    // First try to list the directory contents
    const { data, error } = await supabase
      .storage
      .from('audio')
      .list('buzzers', { sortBy: { column: 'name', order: 'asc' } });
      
    if (error) {
      console.error('[LIST_BUZZERS] Error listing buzzers:', error);
      // Fallback to a hardcoded list if needed
      return fallbackBuzzerList();
    }
    
    if (!data || data.length === 0) {
      console.warn('[LIST_BUZZERS] No buzzer files found in storage.');
      // Fallback to a hardcoded list if needed
      return fallbackBuzzerList();
    }
    
    // Log the actual filenames from storage for debugging
    console.log('[LIST_BUZZERS] Actual buzzers found in storage:', data.map(file => file.name));
    return data;
  } catch (error) {
    console.error('[LIST_BUZZERS] Error in listBuzzers:', error);
    // Fallback to a hardcoded list if needed
    return fallbackBuzzerList();
  }
}

// Updated fallback function with more generic naming in case we need it
function fallbackBuzzerList() {
  console.log('[LIST_BUZZERS] Using fallback buzzer list');
  // These are dummy file objects that mimic the structure returned by storage.list()
  // Note: In a real scenario, we should match the actual file naming pattern from storage
  return [
    { name: 'default_buzzer1.mp3', id: 'fallback1' },
    { name: 'default_buzzer2.mp3', id: 'fallback2' },
    { name: 'default_buzzer3.mp3', id: 'fallback3' },
    { name: 'default_buzzer4.mp3', id: 'fallback4' },
    { name: 'default_buzzer5.mp3', id: 'fallback5' }
  ];
}
