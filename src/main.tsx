
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { preloadAudio } from './utils/audioUtils';
import { testSupabaseAudioAccess } from './utils/buzzerUtils';

// Setup audio system
(async function setupAudio() {
  console.log('Main: Setting up audio system');
  
  try {
    // Test Supabase access
    console.log('Main: Testing Supabase audio bucket access...');
    const testResult = await testSupabaseAudioAccess();
    
    if (testResult.success) {
      console.log('Main: Successfully connected to Supabase audio bucket');
      console.log('Main: Available files:', testResult.data);
    } else {
      console.error('Main: Could not access Supabase audio bucket:', testResult.message);
      console.error('Main: Audio playback may not work correctly');
    }
    
    // List available files in the audio bucket
    const { data: audioFiles, error: listError } = await supabase
      .storage
      .from('audio')
      .list('', { sortBy: { column: 'name', order: 'asc' } });
    
    if (listError) {
      console.error('Main: Error listing audio files:', listError);
    } else {
      console.log('Main: Available audio files in bucket:', audioFiles?.map(f => f.name) || []);
    }
  } catch (error) {
    console.error('Main: Error during Supabase audio access test:', error);
  }
  
  // Try to preload audio files early
  console.log('Main: Preloading audio files on startup');
  try {
    preloadAudio();
  } catch (error) {
    console.error('Main: Error preloading audio:', error);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
