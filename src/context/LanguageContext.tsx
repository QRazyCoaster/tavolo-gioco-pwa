
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
  },
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
  },
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
