
import { supabase } from '@/supabaseClient';

export async function listBuzzers() {
  try {
    console.log('Listing buzzer sounds from storage...');
    const { data, error } = await supabase
      .storage
      .from('audio')
      .list('buzzers', { sortBy: { column: 'name', order: 'asc' } });
      
    if (error) {
      console.error('Error listing buzzers:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.warn('No buzzer files found in storage.');
      return [];
    }
    
    console.log('Buzzers found:', data.map(file => file.name));
    return data;
  } catch (error) {
    console.error('Error in listBuzzers:', error);
    return [];
  }
}
