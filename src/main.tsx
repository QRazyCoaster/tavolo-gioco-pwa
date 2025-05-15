
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadAudio } from './utils/audioUtils.ts'

// Preload audio before rendering
Promise.all([
  preloadAudio(),
]).then(() => {
  console.log('✅ Audio preloaded successfully')
  createRoot(document.getElementById("root")!).render(<App />);
});
