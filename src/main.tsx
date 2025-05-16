
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { preloadAudio } from './utils/audioUtils';

// Try to preload audio files early
console.log('Main: Preloading audio files on startup');
try {
  preloadAudio();
} catch (error) {
  console.error('Error preloading audio in main:', error);
}

createRoot(document.getElementById("root")!).render(<App />);
