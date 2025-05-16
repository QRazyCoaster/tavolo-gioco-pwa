
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { preloadAudio, setAudioSource } from './utils/audioUtils';
import { testSupabaseAudioAccess } from './utils/buzzerUtils';

// Determine where to load audio files from
(async function setupAudio() {
  console.log('Main: Setting up audio system');
  
  try {
    // Test Supabase access
    const testResult = await testSupabaseAudioAccess();
    
    if (testResult.success) {
      console.log('Main: Using Supabase for audio files');
      setAudioSource('supabase');
    } else {
      console.log('Main: Fallback to local audio files');
      setAudioSource('local');
    }
  } catch (error) {
    console.error('Error during audio setup:', error);
    console.log('Main: Using local audio files due to error');
    setAudioSource('local');
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
