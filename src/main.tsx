
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { preloadAudio } from './utils/audioUtils.ts'

// Display loading indicator
const loadingElement = document.createElement('div');
loadingElement.style.position = 'fixed';
loadingElement.style.top = '0';
loadingElement.style.left = '0';
loadingElement.style.width = '100%';
loadingElement.style.height = '100%';
loadingElement.style.display = 'flex';
loadingElement.style.alignItems = 'center';
loadingElement.style.justifyContent = 'center';
loadingElement.style.background = '#f9fafb';
loadingElement.textContent = 'Loading audio resources...';
document.body.appendChild(loadingElement);

// Preload audio before rendering with timeout to prevent infinite loading
const preloadPromise = Promise.race([
  preloadAudio(),
  new Promise(resolve => setTimeout(resolve, 5000)) // 5-second timeout
]);

preloadPromise.then(() => {
  console.log('✅ Audio resources loaded or timed out');
  // Remove loading indicator
  document.body.removeChild(loadingElement);
  // Render the app
  createRoot(document.getElementById("root")!).render(<App />);
}).catch(error => {
  console.error('Error during preload:', error);
  // If an error occurs, remove loading and still render the app
  document.body.removeChild(loadingElement);
  createRoot(document.getElementById("root")!).render(<App />);
});
