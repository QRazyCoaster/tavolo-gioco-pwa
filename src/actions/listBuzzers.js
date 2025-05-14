
import { supabase } from '@/supabaseClient';

// Define actual list of known buzzer files that exist in the storage
const KNOWN_BUZZER_FILES = [
  'Aaaaa.MP3',
  'cagnolino.MP3',
  'AIR BUBBLE.WAV',
  'ALARM.WAV',
  'ALERT.WAV',
  'BLIP.WAV',
  'BUZZ.WAV',
  'CORD.WAV',
  'OK.WAV',
  'PHASERS.WAV',
  'TYPEWRITER.WAV',
  'WRONG.WAV'
];

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
      return getKnownBuzzerFiles();
    }
    
    if (!data || data.length === 0) {
      console.warn('[LIST_BUZZERS] No buzzer files found in storage.');
      return getKnownBuzzerFiles();
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
      console.warn('[LIST_BUZZERS] No audio files in the bucket, using known buzzer files');
      return getKnownBuzzerFiles();
    }
    
    return audioFiles;
  } catch (error) {
    console.error('[LIST_BUZZERS] Error in listBuzzers:', error);
    return getKnownBuzzerFiles();
  }
}

// Function to create file objects for known buzzer files
function getKnownBuzzerFiles() {
  console.log('[LIST_BUZZERS] Using known buzzer file list');
  return KNOWN_BUZZER_FILES.map((name, index) => ({ 
    name: name, 
    id: 'known-' + index 
  }));
}
