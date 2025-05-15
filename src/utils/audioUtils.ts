/**
 * Audio utilities for game sounds
 */

// Tipologie di audio supportate
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

// Cache per gli oggetti audio precaricati
const audioCache: Record<string, HTMLAudioElement> = {};

// Mappatura dei tipi audio ai loro percorsi file
const audioMappings: Record<string, string> = {
  buttonClick: '/audio/click.mp3',
  notification: '/audio/notification.mp3',
  success: '/audio/success.mp3',
  error: '/audio/error.mp3',
  gameStart: '/audio/game-start.mp3',
  buzzer: '/audio/buzzer.mp3',
  chime: '/audio/chime.mp3',
  tick: '/audio/tick.mp3',
  background: '/audio/background-music.mp3',
  backgroundMusic: '/audio/background-music.mp3',
};

/**
 * Precarica un audio per utilizzo successivo
 */
export const preloadAudio = (type?: AudioType): void => {
  try {
    if (type) {
      if (!audioCache[type]) {
        const audio = new Audio(audioMappings[type]);
        audio.load();
        audioCache[type] = audio;
        console.log(`✅ Audio preloaded: ${type}`);
      }
    } else {
      // Preload all audio if no type specified
      preloadAllAudio();
    }
  } catch (error) {
    console.error(`❌ Error preloading audio ${type || 'all'}:`, error);
  }
};

/**
 * Precarica il suono del click del pulsante
 */
export const preloadButtonClickSound = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      preloadAudio('buttonClick');
      resolve();
    } catch (error) {
      console.error('❌ Error preloading button click sound:', error);
      resolve();
    }
  });
};

/**
 * Precarica tutti gli audio disponibili
 */
export const preloadAllAudio = (): void => {
  Object.keys(audioMappings).forEach((type) => {
    if (!audioCache[type]) {
      const audio = new Audio(audioMappings[type]);
      audio.load();
      audioCache[type] = audio;
    }
  });
  console.log('✅ All audio preloaded');
};

/**
 * Riproduce un audio
 */
export const playAudio = (type: AudioType, options?: { volume?: number; loop?: boolean }): void => {
  try {
    let audio = audioCache[type];
    
    // Se non è in cache, lo crea al volo
    if (!audio) {
      audio = new Audio(audioMappings[type]);
      audioCache[type] = audio;
    }
    
    // Imposta il volume se specificato
    if (options?.volume !== undefined) {
      audio.volume = options.volume;
    }
    
    // Imposta se deve riprodursi in loop
    if (options?.loop !== undefined) {
      audio.loop = options.loop;
    }
    
    // Reimposta l'audio prima della riproduzione
    audio.currentTime = 0;
    
    // Riproduci l'audio
    audio.play().catch(error => {
      console.error(`❌ Error playing audio ${type}:`, error);
    });
    
  } catch (error) {
    console.error(`❌ Error playing audio ${type}:`, error);
  }
};

/**
 * Riproduce il buffer del click per feedback immediato
 */
export const playClickBuffer = (): void => {
  playAudio('buttonClick', { volume: 0.5 });
};

/**
 * Ferma un audio in riproduzione
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
 * Pausa un audio in riproduzione
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
 * Riprende un audio in pausa
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
 * Verifica se un audio è in riproduzione
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
 * Riproduce la musica di sottofondo
 */
export const playBackgroundMusic = (type: AudioType = 'backgroundMusic', volume: number = 0.2): void => {
  try {
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
 * Ferma la musica di sottofondo
 */
export const stopBackgroundMusic = (): void => {
  stopAudio('backgroundMusic');
  localStorage.setItem('backgroundMusicEnabled', 'false');
};

// Aggiungi gestori di eventi per la visibilità della pagina e la chiusura
const handleVisibilityChange = () => {
  if (document.hidden) {
    // La pagina è nascosta, ferma tutti gli audio in background
    pauseAudio('background');
    pauseAudio('backgroundMusic');
  } else {
    // La pagina è di nuovo visibile, verifica se dobbiamo riprendere la musica
    const shouldPlayMusic = localStorage.getItem('backgroundMusicEnabled') === 'true';
    if (shouldPlayMusic) {
      resumeAudio('background');
      resumeAudio('backgroundMusic');
    }
  }
};

// Evento quando la pagina viene nascosta (cambio app/scheda, blocco telefono)
document.addEventListener('visibilitychange', handleVisibilityChange);

// Evento quando la pagina sta per essere scaricata/chiusa
window.addEventListener('beforeunload', () => {
  Object.keys(audioCache).forEach(key => {
    stopAudio(key as AudioType);
  });
});

// Eventi specifici per mobile per gestire la riproduzione audio
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
}); // Per WebKit su iOS
document.addEventListener('resign', () => {
  pauseAudio('background');
  pauseAudio('backgroundMusic');
}); // Per alcune app WebView
