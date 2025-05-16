
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
    const testResult = await testSupabaseAudioAccess();
    
    if (testResult.success) {
      console.log('Main: Successfully connected to Supabase audio bucket');
    } else {
      console.error('Main: Could not access Supabase audio bucket:', testResult.message);
      console.error('Main: Audio playback may not work correctly');
    }
  } catch (error) {
    console.error('Error during Supabase audio access test:', error);
  }
  
  // Try to preload audio files early
  console.log('Main: Preloading audio files on startup');
  try {
    preloadAudio();
  } catch (error) {
    console.error('Error preloading audio in main:', error);
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
