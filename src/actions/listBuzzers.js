import { supabase } from '@/supabaseClient';

export async function listBuzzers() {
  try {
    console.log('[LIST_BUZZERS] Listing buzzer sounds from storage…');

    // 1 – List the contents of the buzzers folder
    const { data, error } = await supabase
      .storage
      .from('audio')
      .list('buzzers', { sortBy: { column: 'name', order: 'asc' } });

    if (error) {
      console.error('[LIST_BUZZERS] Error listing buzzers:', error);
      return [];                         // no fallback array needed
    }

    if (!data || data.length === 0) {
      console.warn('[LIST_BUZZERS] No buzzer files found in storage.');
      return [];
    }

    // 2 – Keep only audio files (ignore sub‑folders)
    const audioFiles = data.filter(file => {
      const lowerName = file.name.toLowerCase();
      return !file.id.endsWith('/') &&
             (lowerName.endsWith('.mp3') ||
              lowerName.endsWith('.wav') ||
              lowerName.endsWith('.ogg'));
    });

    console.log('[LIST_BUZZERS] All files in bucket:', data.map(f => f.name));
    console.log('[LIST_BUZZERS] Filtered audio files:', audioFiles.map(f => f.name));

    if (audioFiles.length === 0) {
      console.warn('[LIST_BUZZERS] No audio files after filtering.');
      return [];
    }

    return audioFiles;
  } catch (error) {
    console.error('[LIST_BUZZERS] Unexpected error:', error);
    return [];
  }
}
