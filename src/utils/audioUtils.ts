
/**
 * Audio utilities for game sounds
 */

// Types of supported audio
type AudioType = 
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

// Mapping audio types to file paths
const audioMappings: Record<string, string> = {
  buttonClick: '/audio/button-click.mp3',  // Updated path to match README
  notification: '/audio/notification.mp3',
  success: '/audio/success.mp3',
  error: '/audio/wrong.mp3',               // Updated path to match README
  gameStart: '/audio/game-start.mp3',
  buzzer: '/audio/buzzer.mp3',
  chime: '/audio/chime.mp3',
  tick: '/audio/countdown.mp3',            // Updated path to match README
  background: '/audio/background-music.mp3',
  backgroundMusic: '/audio/background-music.mp3',
};

/**
 * Preload an audio for later use
 */
export const preloadAudio = (type?: AudioType): Promise<void> => {
  return new Promise((resolve) => {
    try {
      if (type) {
        if (!audioCache[type]) {
          const audioPath = audioMappings[type];
          console.log(`🔊 Preloading audio: ${type} from ${audioPath}`);
          
          const audio = new Audio(audioPath);
          audio.load();
          audioCache[type] = audio;
          
          // Resolve when loaded or on error
          audio.addEventListener('canplaythrough', () => {
            console.log(`✅ Audio preloaded: ${type}`);
            resolve();
          }, { once: true });
          
          audio.addEventListener('error', (e) => {
            console.error(`❌ Error preloading audio ${type}:`, e);
            resolve(); // Still resolve to not block loading
          }, { once: true });
        } else {
          resolve(); // Already cached
        }
      } else {
        // Preload all audio if no type specified
        preloadAllAudio().then(() => resolve());
      }
    } catch (error) {
      console.error(`❌ Error in preloadAudio (${type || 'all'}):`, error);
      resolve(); // Still resolve to not block loading
    }
  });
};

/**
 * Preload button click sound
 */
export const preloadButtonClickSound = (): Promise<void> => {
  return preloadAudio('buttonClick');
};

/**
 * Preload all available audio
 */
export const preloadAllAudio = (): Promise<void> => {
  console.log('🔊 Preloading all audio files...');
  
  return new Promise((resolve) => {
    const promises = Object.keys(audioMappings).map(type => {
      if (!audioCache[type]) {
        const audio = new Audio(audioMappings[type]);
        audioCache[type] = audio;
        return new Promise<void>((res) => {
          audio.addEventListener('canplaythrough', () => res(), { once: true });
          audio.addEventListener('error', () => res(), { once: true });
          audio.load();
        });
      }
      return Promise.resolve();
    });
    
    Promise.all(promises).then(() => {
      console.log('✅ All audio preloaded');
      resolve();
    });
  });
};

/**
 * Play an audio
 */
export const playAudio = (type: AudioType, options?: { volume?: number; loop?: boolean }): HTMLAudioElement | undefined => {
  try {
    let audio = audioCache[type];
    
    // If not in cache, create it on the fly
    if (!audio) {
      const audioPath = audioMappings[type];
      console.log(`🔊 Creating audio on demand: ${type} from ${audioPath}`);
      audio = new Audio(audioPath);
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
    console.log(`🔊 Playing audio: ${type}`);
    audio.play().catch(error => {
      console.error(`❌ Error playing audio ${type}:`, error);
    });
    
    return audio;
  } catch (error) {
    console.error(`❌ Error playing audio ${type}:`, error);
    return undefined;
  }
};

/**
 * Play button click buffer for immediate feedback
 */
export const playClickBuffer = (): void => {
  playAudio('buttonClick', { volume: 0.5 });
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
    console.error(`❌ Error stopping audio ${type}:`, error);
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
    console.error(`❌ Error pausing audio ${type}:`, error);
  }
};

/**
 * Resume a paused audio
 */
export const resumeAudio = (type: AudioType): void => {
  try {
    const audio = audioCache[type];
    if (audio) {
      audio.play().catch(error => {
        console.error(`❌ Error resuming audio ${type}:`, error);
      });
    }
  } catch (error) {
    console.error(`❌ Error resuming audio ${type}:`, error);
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

/**
 * Play background music
 */
export const playBackgroundMusic = (type: AudioType = 'backgroundMusic', volume: number = 0.2): void => {
  try {
    console.log(`🎵 Playing background music: ${type} at volume ${volume}`);
    
    const audio = audioCache[type] || new Audio(audioMappings[type]);
    
    if (!audioCache[type]) {
      audioCache[type] = audio;
    }
    
    audio.volume = volume;
    audio.loop = true;
    
    // Prevent multiple instances playing
    audio.currentTime = 0;
    
    audio.play().catch(error => {
      console.error(`❌ Error playing background music:`, error);
    });
    
    localStorage.setItem('backgroundMusicEnabled', 'true');
    
  } catch (error) {
    console.error(`❌ Error playing background music:`, error);
  }
};

/**
 * Stop background music
 */
export const stopBackgroundMusic = (): void => {
  stopAudio('backgroundMusic');
  localStorage.setItem('backgroundMusicEnabled', 'false');
};

// Add event handlers for page visibility and closing
const handleVisibilityChange = () => {
  if (document.hidden) {
    // Page is hidden, pause all background audio
    pauseAudio('background');
    pauseAudio('backgroundMusic');
  } else {
    // Page is visible again, check if we should resume music
    const shouldPlayMusic = localStorage.getItem('backgroundMusicEnabled') === 'true';
    if (shouldPlayMusic) {
      resumeAudio('background');
      resumeAudio('backgroundMusic');
    }
  }
};

// Event when page is hidden (app/tab switch, phone lock)
document.addEventListener('visibilitychange', handleVisibilityChange);

// Event when page is about to be unloaded/closed
window.addEventListener('beforeunload', () => {
  Object.keys(audioCache).forEach(key => {
    stopAudio(key as AudioType);
  });
});

// Mobile-specific events to handle audio playback
window.addEventListener('pagehide', () => {
  pauseAudio('background');
  pauseAudio('backgroundMusic');
});
window.addEventListener('beforeunload', () => {
  pauseAudio('background');
  pauseAudio('backgroundMusic');
});
document.addEventListener('pause', () => {
  pauseAudio('background');
  pauseAudio('backgroundMusic');
}); // For WebKit on iOS
document.addEventListener('resign', () => {
  pauseAudio('background');
  pauseAudio('backgroundMusic');
}); // For some WebView apps
