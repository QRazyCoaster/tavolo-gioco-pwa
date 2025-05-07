
type AudioMap = {
  [key: string]: HTMLAudioElement;
};

// Cache for preloaded audio elements
const audioCache: AudioMap = {};

/**
 * Preload audio files
 * @param audioFiles - Object with audio names and paths
 * @returns Promise that resolves when all audio files are loaded
 */
export const preloadAudio = async (audioFiles: Record<string, string>): Promise<void> => {
  const loadPromises = Object.entries(audioFiles).map(([name, path]) => {
    return new Promise<void>((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'auto';
      
      audio.oncanplaythrough = () => {
        audioCache[name] = audio;
        resolve();
      };
      
      audio.onerror = () => {
        reject(new Error(`Failed to load audio: ${path}`));
      };
      
      audio.src = path;
      audio.load();
    });
  });

  try {
    await Promise.all(loadPromises);
    console.log('All audio files preloaded successfully');
  } catch (error) {
    console.error('Error preloading audio files:', error);
  }
};

/**
 * Play a preloaded audio file
 * @param name - Name of the audio file to play
 */
export const playAudio = (name: string): void => {
  if (audioCache[name]) {
    // Create a new Audio instance that uses the cached file
    // This allows for multiple simultaneous playback
    const audio = audioCache[name].cloneNode() as HTMLAudioElement;
    audio.play().catch(err => console.error('Error playing audio:', err));
  } else {
    console.warn(`Audio "${name}" not found in cache`);
  }
};

/**
 * Set of common game sounds to be preloaded
 */
export const gameAudioFiles = {
  buttonClick: '/audio/button-click.mp3',
  correct: '/audio/correct.mp3',
  wrong: '/audio/wrong.mp3',
  countdown: '/audio/countdown.mp3',
  success: '/audio/success.mp3',
  buzzer: '/audio/buzzer.mp3',
  notification: '/audio/notification.mp3',
};
