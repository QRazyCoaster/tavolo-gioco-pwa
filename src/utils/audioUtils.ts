
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
  | 'background';

// Cache per gli oggetti audio precaricati
const audioCache: Record<string, HTMLAudioElement> = {};

// Mappatura dei tipi audio ai loro percorsi file
const audioMappings: Record<AudioType, string> = {
  buttonClick: '/audio/click.mp3',
  notification: '/audio/notification.mp3',
  success: '/audio/success.mp3',
  error: '/audio/error.mp3',
  gameStart: '/audio/game-start.mp3',
  buzzer: '/audio/buzzer.mp3',
  chime: '/audio/chime.mp3',
  tick: '/audio/tick.mp3',
  background: '/audio/background-music.mp3',
};

/**
 * Precarica un audio per utilizzo successivo
 */
export const preloadAudio = (type: AudioType): void => {
  try {
    if (!audioCache[type]) {
      const audio = new Audio(audioMappings[type]);
      audio.load();
      audioCache[type] = audio;
      console.log(`✅ Audio preloaded: ${type}`);
    }
  } catch (error) {
    console.error(`❌ Error preloading audio ${type}:`, error);
  }
};

/**
 * Precarica tutti gli audio disponibili
 */
export const preloadAllAudio = (): void => {
  Object.keys(audioMappings).forEach((type) => {
    preloadAudio(type as AudioType);
  });
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

// Aggiungi gestori di eventi per la visibilità della pagina e la chiusura
const handleVisibilityChange = () => {
  if (document.hidden) {
    // La pagina è nascosta, ferma tutti gli audio in background
    pauseAudio('background');
  } else {
    // La pagina è di nuovo visibile, verifica se dobbiamo riprendere la musica
    const shouldPlayMusic = localStorage.getItem('backgroundMusicEnabled') === 'true';
    if (shouldPlayMusic) {
      resumeAudio('background');
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
window.addEventListener('pagehide', () => pauseAudio('background'));
window.addEventListener('beforeunload', () => pauseAudio('background'));
document.addEventListener('pause', () => pauseAudio('background')); // Per WebKit su iOS
document.addEventListener('resign', () => pauseAudio('background')); // Per alcune app WebView
