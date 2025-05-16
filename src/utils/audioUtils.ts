
/**
 * Audio utilities for game sounds
 */
import { supabase } from '@/supabaseClient';
import { getBuzzerUrl } from './buzzerUtils';

// Types of supported audio
export type AudioType = 
  | 'buttonClick'
  | 'notification'
  | 'success'
  | 'error' 
  | 'gameStart'
  | 'buzzer'
  | 'chime'
  | 'tick'
  | 'background'
  | 'backgroundMusic';

// Cache for preloaded audio objects
const audioCache: Record<string, HTMLAudioElement> = {};

// Source of audio - either local or Supabase
type AudioSource = 'local' | 'supabase';

// Default audio source - this can be configured at runtime
let audioSource: AudioSource = 'supabase';

// Mapping audio types to file paths for local files
const localAudioMappings: Record<string, string> = {
  buttonClick: '/audio/button-click.mp3',
  notification: '/audio/notification.mp3',
  success: '/audio/success.mp3',
  error: '/audio/wrong.mp3',
  gameStart: '/audio/game-start.mp3',
  buzzer: '/audio/buzzer.mp3',
  chime: '/audio/chime.mp3',
  tick: '/audio/countdown.mp3',
  background: '/audio/background-music.mp3',
  backgroundMusic: '/audio/background-music.mp3',
};

/**
 * Get the URL for an audio file
 */
export const getAudioUrl = (type: AudioType): string => {
  try {
    // For all non-Supabase audio (when using local files)
    if (audioSource === 'local') {
      return localAudioMappings[type];
    }
    
    // Use Supabase storage URLs
    const { data } = supabase
      .storage
      .from('audio')
      .getPublicUrl(type === 'buzzer' ? 'buzzers/buzzer.mp3' : `${type}.mp3`);
    
    return data.publicUrl;
  } catch (error) {
    console.error(`Error getting audio URL for ${type}:`, error);
    // Fallback to local files if Supabase fails
    return localAudioMappings[type];
  }
};

/**
 * Set the audio source (local or Supabase)
 */
export const setAudioSource = (source: AudioSource): void => {
  audioSource = source;
  console.log(`Audio source set to: ${source}`);
};

/**
 * Simplified preload function that won't block rendering
 */
export const preloadAudio = (type?: AudioType): void => {
  try {
    if (type) {
      if (!audioCache[type]) {
        const url = getAudioUrl(type);
        const audio = new Audio(url);
        audioCache[type] = audio;
        console.log(`Preloaded audio: ${type} from ${url}`);
      }
    } else {
      // Preload all audio files in background
      Object.keys(localAudioMappings).forEach(key => {
        if (!audioCache[key]) {
          const audioType = key as AudioType;
          const url = getAudioUrl(audioType);
          const audio = new Audio(url);
          audioCache[key] = audio;
          console.log(`Preloaded audio: ${key} from ${url}`);
        }
      });
    }
  } catch (error) {
    console.error('Error preloading audio:', error);
  }
};

/**
 * Play an audio file
 */
export const playAudio = (type: AudioType, options?: { volume?: number; loop?: boolean }): HTMLAudioElement | undefined => {
  try {
    let audio = audioCache[type];
    
    // If not in cache, create it on the fly
    if (!audio) {
      console.log(`Creating new audio for ${type}`);
      const url = getAudioUrl(type);
      audio = new Audio(url);
      audioCache[type] = audio;
    }
    
    // Set volume if specified
    if (options?.volume !== undefined) {
      audio.volume = options.volume;
    }
    
    // Set if should play in loop
    if (options?.loop !== undefined) {
      audio.loop = options.loop;
    }
    
    // Reset audio before playing
    audio.currentTime = 0;
    
    // Play audio
    console.log(`Attempting to play audio: ${type}`);
    const playPromise = audio.play();
    
    // Handle play promise rejection
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error(`Error playing audio ${type}:`, error);
      });
    }
    
    return audio;
  } catch (error) {
    console.error(`Error playing audio ${type}:`, error);
    return undefined;
  }
};

/**
 * Play background music
 */
export const playBackgroundMusic = (type: AudioType = 'backgroundMusic', volume: number = 0.2): void => {
  try {
    console.log('Attempting to play background music');
    
    // Create audio context to help overcome autoplay restrictions
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    let audio = audioCache[type];
    if (!audio) {
      console.log('Creating new background music audio');
      const url = getAudioUrl(type);
      audio = new Audio(url);
      audioCache[type] = audio;
    }
    
    audio.volume = volume;
    audio.loop = true;
    
    console.log('Playing background music');
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error(`Error playing background music:`, error);
        // On autoplay restriction, we'll need user interaction
        document.addEventListener('click', function audioUnlockHandler() {
          console.log('User interaction detected, trying to play again');
          audio.play().catch(e => console.error('Still failed to play:', e));
          document.removeEventListener('click', audioUnlockHandler);
        }, { once: true });
      });
    }
    
    localStorage.setItem('backgroundMusicEnabled', 'true');
  } catch (error) {
    console.error(`Error playing background music:`, error);
  }
};

/**
 * Stop background music
 */
export const stopBackgroundMusic = (): void => {
  try {
    console.log('Stopping background music');
    const audio = audioCache['backgroundMusic'];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    localStorage.setItem('backgroundMusicEnabled', 'false');
  } catch (error) {
    console.error('Error stopping background music:', error);
  }
};

/**
 * Stop a playing audio
 */
export const stopAudio = (type: AudioType): void => {
  try {
    const audio = audioCache[type];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  } catch (error) {
    console.error(`Error stopping audio ${type}:`, error);
  }
};

/**
 * Pause a playing audio
 */
export const pauseAudio = (type: AudioType): void => {
  try {
    const audio = audioCache[type];
    if (audio) {
      audio.pause();
    }
  } catch (error) {
    console.error(`Error pausing audio ${type}:`, error);
  }
};

/**
 * Resume a paused audio
 */
export const resumeAudio = (type: AudioType): void => {
  try {
    const audio = audioCache[type];
    if (audio) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error(`Error resuming audio ${type}:`, error);
        });
      }
    }
  } catch (error) {
    console.error(`Error resuming audio ${type}:`, error);
  }
};

/**
 * Check if an audio is playing
 */
export const isAudioPlaying = (type: AudioType): boolean => {
  try {
    const audio = audioCache[type];
    return audio ? !audio.paused : false;
  } catch {
    return false;
  }
};

// Basic event listeners for page visibility and closing
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    pauseAudio('backgroundMusic');
  } else {
    const shouldPlayMusic = localStorage.getItem('backgroundMusicEnabled') === 'true';
    if (shouldPlayMusic) {
      resumeAudio('backgroundMusic');
    }
  }
});

window.addEventListener('beforeunload', () => {
  Object.keys(audioCache).forEach(key => {
    pauseAudio(key as AudioType);
  });
});
