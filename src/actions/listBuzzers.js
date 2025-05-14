import { supabase } from '@/supabaseClient';

export async function listBuzzers() {
  try {
    console.log('[LIST_BUZZERS] Listing buzzer sounds from storage…');

    // 1 – List everything inside the buzzers folder
    const { data, error } = await supabase
      .storage
      .from('audio')
      .list('buzzers', { sortBy: { column: 'name', order: 'asc' } });

    if (error) {
      console.error('[LIST_BUZZERS] Error listing buzzers:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('[LIST_BUZZERS] No files found in storage.');
      return [];
    }

    // 2 – Keep only files whose names end in .mp3/.wav/.ogg  (case‑insensitive)
    const audioFiles = data.filter(file =>
      /\.(mp3|wav|ogg)$/i.test(file.name)
    );

    console.log('[LIST_BUZZERS] All files:', data.map(f => f.name));
    console.log('[LIST_BUZZERS] Audio files:', audioFiles.map(f => f.name));

    return audioFiles;
  } catch (err) {
    console.error('[LIST_BUZZERS] Unexpected error:', err);
    return [];
  }
}
