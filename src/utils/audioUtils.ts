
type AudioMap = {
  [key: string]: HTMLAudioElement;
};

// Cache for preloaded audio elements
const audioCache: AudioMap = {};

// Reference to the background music instance
let backgroundMusicInstance: HTMLAudioElement | null = null;

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
        console.error(`Failed to load audio: ${path}`);
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
 * Play background music in loop
 * @param name - Name of the audio file to play as background music
 * @param volume - Volume level (0.0 to 1.0)
 */
export const playBackgroundMusic = (name: string, volume = 0.3): void => {
  // If there's already background music playing, stop it first
  if (backgroundMusicInstance) {
    stopBackgroundMusic();
  }
  
  if (audioCache[name]) {
    backgroundMusicInstance = audioCache[name].cloneNode() as HTMLAudioElement;
    backgroundMusicInstance.loop = true;
    backgroundMusicInstance.volume = volume;
    backgroundMusicInstance.play().catch(err => console.error('Error playing background music:', err));
    console.log('Background music started:', name);
  } else {
    console.warn(`Background music "${name}" not found in cache`);
  }
};

/**
 * Stop currently playing background music
 */
export const stopBackgroundMusic = (): void => {
  if (backgroundMusicInstance) {
    backgroundMusicInstance.pause();
    backgroundMusicInstance.currentTime = 0;
    backgroundMusicInstance = null;
    console.log('Background music stopped');
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
  backgroundMusic: 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio//background-music.mp3',
};

