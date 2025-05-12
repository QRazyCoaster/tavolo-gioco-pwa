let buttonClickBuffer: AudioBuffer | null = null;
let audioCtx: AudioContext | null = null;

type AudioMap = {
  [key: string]: HTMLAudioElement;
};

// Cache for preloaded audio elements
const audioCache: AudioMap = {};

// Reference to the background music instance
let backgroundMusicInstance: HTMLAudioElement | null = null;

/**
 * Preload audio files
 */
export const preloadAudio = async (audioFiles: Record<string, string>): Promise<void> => {
  const loadPromises = Object.entries(audioFiles).map(([name, path]) => {
    return new Promise<void>((resolve, reject) => {
      const audio = new Audio(path);
      audio.preload = 'auto';

      audio.oncanplaythrough = () => {
        audioCache[name] = audio;
        resolve();
      };

      audio.onerror = () => {
        console.error(`Failed to load audio: ${path}`);
        reject(new Error(`Failed to load audio: ${path}`));
      };

      // Try to silently trigger decode
      audio.volume = 0.0;
      audio.play().catch(() => resolve()); // ignore autoplay block
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
 * Preload button click sound as a decoded buffer for Safari
 */
export const preloadButtonClickSound = async () => {
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const response = await fetch(gameAudioFiles.buttonClick);
    const arrayBuffer = await response.arrayBuffer();
    buttonClickBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    console.log('Button click decoded and ready');
  } catch (err) {
    console.error('Failed to preload button click sound:', err);
  }
};

/**
 * Play preloaded button click buffer instantly
 */
export const playClickBuffer = () => {
  if (audioCtx && buttonClickBuffer) {
    const source = audioCtx.createBufferSource();
    source.buffer = buttonClickBuffer;
    source.connect(audioCtx.destination);
    source.start(0);
  }
};

/**
 * Play a preloaded audio file
 */
export const playAudio = (name: string): void => {
  if (audioCache[name]) {
    const audio = audioCache[name].cloneNode() as HTMLAudioElement;
    audio.volume = 1.0;
    audio.play().catch(err => console.error('Error playing audio:', err));
  } else {
    console.warn(`Audio "${name}" not found in cache`);
  }
};

/**
 * Play background music in loop
 */
export const playBackgroundMusic = (name: string, volume = 0.2): void => {
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
 * Map of audio files used in the game
 */
export const gameAudioFiles = {
  buttonClick: 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/button-click.mp3',
  correct: 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/correct.mp3',
  wrong: 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/wrong.mp3',
  countdown: 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/countdown.mp3',
  success: 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/success.mp3',
  buzzer: 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/buzzer.mp3',
  notification: 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/notification.mp3',
  backgroundMusic: 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/background-music.mp3',
};
