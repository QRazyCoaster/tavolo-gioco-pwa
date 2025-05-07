import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define our language type and translations interface
export type Language = 'it' | 'en';

// Updated interface to correctly handle the nested structure
interface Translations {
  [language: string]: {
    [category: string]: {
      [key: string]: string;
    };
  };
}

// Italian translations
const it = {
  common: {
    host: 'Narratore',
    player: 'Giocatore',
    join: 'Partecipa',
    create: 'Crea',
    back: 'Indietro',
    next: 'Avanti',
    start: 'Inizia',
    cancel: 'Annulla',
    pin: 'Codice PIN',
    language: 'Lingua',
    welcome: 'Benvenuto a Tavolo Gioco',
    chooseLanguage: 'Scegli la lingua',
    enterPin: 'Inserisci il PIN',
    createGame: 'Crea una partita',
    joinGame: 'Partecipa a una partita',
    waitingForPlayers: 'In attesa di giocatori...',
    chooseName: 'Scegli il tuo nome',
    chooseGame: 'Scegli un gioco',
    players: 'Giocatori',
    select: 'Seleziona',
    waitingForHost: 'In attesa del narratore...',
    endGame: 'Termina il gioco',
    loadingResources: 'Caricamento risorse...',
    gameRules: 'Regole del gioco',
    readBeforePlaying: 'Leggi prima di giocare',
    rules: 'Regole',
    continue: 'Continua',
    noGameSelected: 'Nessun gioco selezionato',
  },
  games: {
    trivia: 'Trivia',
    triviaDesc: 'Sfida le tue conoscenze con domande di cultura generale',
    bottleGame: 'Gioco della Bottiglia',
    bottleGameDesc: 'Divertimento classico con la bottiglia che gira',
  },
  rules: {
    trivia1: 'Ogni giocatore risponde a domande a turno',
    trivia2: 'Per ogni risposta corretta, guadagnerai 1 punto',
    trivia3: 'Hai 20 secondi per rispondere ad ogni domanda',
    trivia4: 'Il giocatore con più punti alla fine vince',
    bottle1: 'I giocatori siedono in cerchio',
    bottle2: 'A turno, ogni giocatore fa girare la bottiglia',
    bottle3: 'Il giocatore a cui punta la bottiglia deve rispondere a una domanda o fare un\'azione',
    bottle4: 'Divertimento garantito per tutti!',
  }
};

// English translations
const en = {
  common: {
    host: 'Host',
    player: 'Player',
    join: 'Join',
    create: 'Create',
    back: 'Back',
    next: 'Next',
    start: 'Start',
    cancel: 'Cancel',
    pin: 'PIN Code',
    language: 'Language',
    welcome: 'Welcome to Tavolo Gioco',
    chooseLanguage: 'Choose language',
    enterPin: 'Enter PIN',
    createGame: 'Create a game',
    joinGame: 'Join a game',
    waitingForPlayers: 'Waiting for players...',
    chooseName: 'Choose your name',
    chooseGame: 'Choose a game',
    players: 'Players',
    select: 'Select',
    waitingForHost: 'Waiting for host...',
    endGame: 'End game',
    loadingResources: 'Loading resources...',
    gameRules: 'Game Rules',
    readBeforePlaying: 'Read before playing',
    rules: 'Rules',
    continue: 'Continue',
    noGameSelected: 'No game selected',
  },
  games: {
    trivia: 'Trivia',
    triviaDesc: 'Test your knowledge with general knowledge questions',
    bottleGame: 'Bottle Game',
    bottleGameDesc: 'Classic fun with the spinning bottle',
  },
  rules: {
    trivia1: 'Choose the first host.',
    trivia2: 'Click "NEXT" to continue.',
    trivia3: 'The host clicks "Start Game" and receives a 4-digit PIN.',
    trivia4: 'Others enter their name and PIN to join.',
    trivia5: 'Play the game!',
    trivia6: 'After each round, the host role passes to another player.',
    trivia7: 'The game ends when everyone has been the host.',
    trivia8: 'At the end of the game:',
    trivia9: '🏆 The player with the most points gets a free drink.',
    trivia10: '😅 The player with the least points plays Truth or Dare.',
    bottle1: 'Players sit in a circle',
    bottle2: 'Each player takes turns spinning the bottle',
    bottle3: 'The player the bottle points to must answer a question or perform an action',
    bottle4: 'Fun is guaranteed for everyone!',
  }
};

// Combine all translations
const translations: Translations = { it, en };

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  // Translation function
  const t = (key: string): string => {
    const keys = key.split('.');
    if (keys.length !== 2) return key; // We expect keys like "common.welcome"

    const category = keys[0];
    const stringKey = keys[1];

    if (translations[language] && translations[language][category] && translations[language][category][stringKey]) {
      return translations[language][category][stringKey];
    }

    // Fallback to English if translation not found
    if (language !== 'en' && translations['en'][category] && translations['en'][category][stringKey]) {
      return translations['en'][category][stringKey];
    }

    return key; // Return the key as is if no translation found
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook for using language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
