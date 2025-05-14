import { supabase } from '@/supabaseClient';

// ── Static fallback list of all buzzer files ──
const KNOWN_BUZZER_FILES = [
  'Aaaaa.MP3',
  'cagnolino.MP3',
  'Cane.MP3',
  'Fischio.MP3',
  'Gemito.MP3',
  'maiale.MP3',
  'sound5.MP3',
  'Starnuto.MP3',
  'Trombastadio.MP3',
  'Uccello2.MP3',
  'uccello3.MP3',
  'Uccello.MP3'
];

export async function listBuzzers() {
  try {
    console.log('[LIST_BUZZERS] Listing buzzer sounds from storage…');

    // 1 – try to list the ‘buzzers’ folder
    const { data, error } = await supabase
      .storage
      .from('audio')
      .list('buzzers', { sortBy: { column: 'name', order: 'asc' } });

    console.log('[LIST_BUZZERS] raw listing response:', { data, error });

    // 2 – on error, fallback to static list
    if (error) {
      console.error('[LIST_BUZZERS] Error listing buzzers:', error);
      return KNOWN_BUZZER_FILES.map(name => ({ name }));
    }

    // 3 – empty result? use static list
    if (!data || data.length === 0) {
      console.warn('[LIST_BUZZERS] No files found in storage.');
      return KNOWN_BUZZER_FILES.map(name => ({ name }));
    }

    // 4 – filter out non-audio if needed (just in case)
    const audioFiles = data.filter(file =>
      /\.(mp3|wav|ogg)$/i.test(file.name)
    );

    console.log('[LIST_BUZZERS] All files:', data.map(f => f.name));
    console.log('[LIST_BUZZERS] Audio files:', audioFiles.map(f => f.name));

    return audioFiles;
  } catch (err) {
    console.error('[LIST_BUZZERS] Unexpected error:', err);
    // 5 – any other crash? fallback
    return KNOWN_BUZZER_FILES.map(name => ({ name }));
  }
}
