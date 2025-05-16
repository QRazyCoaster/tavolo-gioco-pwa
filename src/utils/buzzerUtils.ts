
import { supabase } from '@/supabaseClient';

/**
 * Returns a fully‑qualified public URL for a buzzer file
 * e.g.  getBuzzerUrl('airhorn.mp3') →
 *       https://xyz.supabase.co/storage/v1/object/public/audio/buzzers/airhorn.mp3
 */
export function getBuzzerUrl(fileName: string) {
  try {
    console.log(`Getting buzzer URL for: ${fileName}`);
    const { data } = supabase
      .storage
      .from('audio') // bucket name
      .getPublicUrl(`buzzers/${fileName}`); // path inside bucket
    
    console.log(`Generated buzzer URL: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    console.error(`Error getting buzzer URL for ${fileName}:`, error);
    // Fallback to a direct Supabase URL construction
    const supabaseUrl = 'https://ybjcwjmzwgobxgopntpy.supabase.co';
    return `${supabaseUrl}/storage/v1/object/public/audio/buzzers/${encodeURIComponent(fileName)}`;
  }
}

/**
 * Test if we can access the Supabase audio bucket
 */
export async function testSupabaseAudioAccess() {
  try {
    console.log('Testing Supabase audio access...');
    const { data, error } = await supabase
      .storage
      .from('audio')
      .list('', { limit: 1 });
    
    if (error) {
      console.error('Supabase audio bucket access error:', error);
      return {
        success: false,
        message: `Error: ${error.message || 'Unknown error'}`,
        error
      };
    }
    
    console.log('Successfully accessed Supabase audio bucket:', data);
    return {
      success: true,
      message: 'Successfully accessed Supabase audio bucket',
      data
    };
  } catch (error) {
    console.error('Exception testing Supabase audio access:', error);
    return {
      success: false,
      message: `Exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    };
  }
}
