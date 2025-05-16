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

// Source of audio - always use Supabase
// We're removing the audioSource variable since we're always using Supabase

// Mapping audio types to file paths for fallbacks
// We'll keep this for reference but not use it directly
const fallbackAudioMappings: Record<string, string> = {
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
 * Get the URL for an audio file from Supabase
 */
export const getAudioUrl = (type: AudioType): string => {
  try {
    // Always use Supabase storage URLs
    if (type === 'buzzer') {
      return getBuzzerUrl('buzzer.mp3'); // Use buzzerUtils for buzzer sounds
    }
    
    const { data } = supabase
      .storage
      .from('audio')
      .getPublicUrl(`${type}.mp3`);
    
    if (!data || !data.publicUrl) {
      throw new Error(`Failed to get URL for ${type}`);
    }
    
    console.log(`Fetched Supabase audio URL for ${type}: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (error) {
    console.error(`Error getting audio URL for ${type}:`, error);
    // Use direct Supabase URL construction as fallback
    const supabaseUrl = 'https://ybjcwjmzwgobxgopntpy.supabase.co';
    const path = type === 'buzzer' ? 'buzzers/buzzer.mp3' : `${type}.mp3`;
    const fallbackUrl = `${supabaseUrl}/storage/v1/object/public/audio/${path}`;
    console.log(`Using fallback URL for ${type}: ${fallbackUrl}`);
    return fallbackUrl;
  }
};

/**
 * We no longer need setAudioSource since we're always using Supabase
 * But we'll keep it as a no-op to avoid breaking existing code
 */
export const setAudioSource = (): void => {
  console.log(`Audio source is fixed to Supabase - setAudioSource call ignored`);
};

/**
 * Simplified preload function that won't block rendering
 */
export const preloadAudio = (type?: AudioType): void => {
  try {
    if (type) {
      if (!audioCache[type]) {
        const url = getAudioUrl(type);
        const audio = new Audio();
        
        // Add event listeners to debug loading issues
        audio.addEventListener('error', (e) => {
          console.error(`Error loading audio ${type} from ${url}:`, e);
        });
        
        audio.addEventListener('canplaythrough', () => {
          console.log(`Audio ${type} successfully loaded from ${url}`);
        });
        
        audio.src = url;
        audioCache[type] = audio;
        console.log(`Attempting to preload audio: ${type} from ${url}`);
      }
    } else {
      // Preload all audio files in background
      const audioTypes: AudioType[] = [
        'buttonClick', 'notification', 'success', 'error',
        'gameStart', 'buzzer', 'chime', 'tick', 
        'background', 'backgroundMusic'
      ];
      
      audioTypes.forEach(audioType => {
        if (!audioCache[audioType]) {
          const url = getAudioUrl(audioType);
          const audio = new Audio();
          
          // Add event listeners to debug loading issues
          audio.addEventListener('error', (e) => {
            console.error(`Error loading audio ${audioType} from ${url}:`, e);
          });
          
          audio.addEventListener('canplaythrough', () => {
            console.log(`Audio ${audioType} successfully loaded from ${url}`);
          });
          
          audio.src = url;
          audioCache[audioType] = audio;
          console.log(`Attempting to preload audio: ${audioType} from ${url}`);
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
