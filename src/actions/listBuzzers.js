import { supabase } from '@/supabaseClient';

export async function listBuzzers() {
  const { data } = await supabase
    .storage
    .from('audio')
    .list('buzzers');            // cartella con i 12 MP3
  return data;                   // array di file
}
