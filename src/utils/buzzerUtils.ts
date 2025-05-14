import { supabase } from '@/supabaseClient';

/**
 * Returns a fully‑qualified public URL for a buzzer file
 * e.g.  getBuzzerUrl('airhorn.mp3') →
 *       https://xyz.supabase.co/storage/v1/object/public/audio/buzzers/airhorn.mp3
 */
export function getBuzzerUrl(fileName: string) {
  const { data } = supabase
    .storage
    .from('audio')
    .getPublicUrl(`buzzers/${fileName}`);
  return data.publicUrl;          // Supabase encodes spaces & handles slashes
}
