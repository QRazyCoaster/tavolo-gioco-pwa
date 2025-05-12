/* -------- module‑level singletons -------- */
let buttonClickBuffer: AudioBuffer | null = null;
let audioCtx: AudioContext | null = null;
const audioCache: { [key: string]: HTMLAudioElement } = {};
let backgroundMusicInstance: HTMLAudioElement | null = null;
let audioPreloaded = false; // NEW — global guard

/* -------- file map -------- */
export const gameAudioFiles = {
  buttonClick: 'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/button-click.mp3',
  correct:     'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/correct.mp3',
  wrong:       'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/wrong.mp3',
  countdown:   'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/countdown.mp3',
  success:     'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/success.mp3',
  buzzer:      'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/buzzer.mp3',
  notification:'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/notification.mp3',
  backgroundMusic:
               'https://ybjcwjmzwgobxgopntpy.supabase.co/storage/v1/object/public/audio/background-music.mp3',
};

/* -------- preload all HTMLAudio elements (once) -------- */
export const preloadAudio = async () => {
  if (audioPreloaded) return;          // guard against duplicates
  audioPreloaded = true;

  await Promise.all(
    Object.entries(gameAudioFiles).map(async ([key, url]) => {
      const el = new Audio(url);
      el.preload = 'auto';
      el.load();                       // just queues the download
      audioCache[key] = el;
    })
  );
  console.log('✅ HTMLAudio elements cached');
};

/* -------- Safari‑friendly decoded buffer for click -------- */
export const preloadButtonClickSound = async () => {
  if (buttonClickBuffer) return;       // already decoded
  audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrBuf = await (await fetch(gameAudioFiles.buttonClick)).arrayBuffer();
  buttonClickBuffer = await audioCtx.decodeAudioData(arrBuf);
  console.log('✅ Button click decoded');
};
export const playClickBuffer = () => {
  if (!audioCtx || !buttonClickBuffer) return;
  const src = audioCtx.createBufferSource();
  src.buffer = buttonClickBuffer;
  src.connect(audioCtx.destination);
  src.start(0);
};

/* -------- simple helpers -------- */
export const playAudio = (name: string) => {
  const base = audioCache[name];
  if (!base) return console.warn('Missing audio', name);
  const a = base.cloneNode() as HTMLAudioElement;
  a.volume = 1;
  a.play().catch(() => {});
};

export const playBackgroundMusic = (name: string, vol = 0.2) => {
  if (backgroundMusicInstance) backgroundMusicInstance.pause();
  const base = audioCache[name];
  if (!base) return console.warn('Missing bgm', name);
  backgroundMusicInstance = base.cloneNode() as HTMLAudioElement;
  backgroundMusicInstance.loop = true;
  backgroundMusicInstance.volume = vol;
  backgroundMusicInstance.play().catch(() => {});
};
export const stopBackgroundMusic = () => {
  if (backgroundMusicInstance) {
    backgroundMusicInstance.pause();
    backgroundMusicInstance.currentTime = 0;
    backgroundMusicInstance = null;
  }
};
