
import { supabase } from '@/supabaseClient';

export async function listBuzzers() {
  try {
    const { data, error } = await supabase
      .storage
      .from('audio')
      .list('buzzers');
      
    if (error) {
      console.error('Error listing buzzers:', error);
      return [];
    }
    
    console.log('Buzzers found:', data);
    return data || [];
  } catch (error) {
    console.error('Error in listBuzzers:', error);
    return [];
  }
}
