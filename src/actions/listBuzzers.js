
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
      return fallbackBuzzerList();
    }
    
    if (!data || data.length === 0) {
      console.warn('[LIST_BUZZERS] No buzzer files found in storage.');
      return fallbackBuzzerList();
    }
    
    // Filter out any folders and non-audio files - case insensitive check
    const audioFiles = data.filter(file => {
      const lowerName = file.name.toLowerCase();
      return !file.id.endsWith('/') && 
             (lowerName.endsWith('.mp3') || 
              lowerName.endsWith('.wav') || 
              lowerName.endsWith('.ogg'));
    });
    
    // Log all files for debugging
    console.log('[LIST_BUZZERS] All files in bucket:', data.map(f => f.name));
    
    // Log the filtered audio files
    console.log('[LIST_BUZZERS] Filtered audio files:', 
                audioFiles.map(file => file.name));
                
    // If no audio files found, return fallback
    if (audioFiles.length === 0) {
      console.warn('[LIST_BUZZERS] No audio files in the bucket, using fallback');
      return fallbackBuzzerList();
    }
    
    return audioFiles;
  } catch (error) {
    console.error('[LIST_BUZZERS] Error in listBuzzers:', error);
    return fallbackBuzzerList();
  }
}

// Updated fallback function with more realistic file names
function fallbackBuzzerList() {
  console.log('[LIST_BUZZERS] Using fallback buzzer list with actual file names');
  // These are dummy file objects that mimic the structure returned by storage.list()
  return [
    { name: 'Aaaaa.MP3', id: 'fallback1' },
    { name: 'cagnolino.MP3', id: 'fallback2' },
    { name: 'buzzer3.mp3', id: 'fallback3' },
    { name: 'buzzer4.mp3', id: 'fallback4' },
    { name: 'buzzer5.mp3', id: 'fallback5' }
  ];
}
