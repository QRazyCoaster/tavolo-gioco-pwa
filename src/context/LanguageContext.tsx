
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Export the Language type so it can be imported elsewhere
export type Language = 'en' | 'it';

interface Translations {
  [key: string]: {
    en: string;
    it: string;
  };
}

// Translations dictionary
const translations: Translations = {
  // Common UI translations
  'common.chooseLanguage': {
    en: 'Choose Language',
    it: 'Scegli Lingua',
  },
  'common.chooseRole': {
    en: 'Choose your role',
    it: 'Scegli il tuo ruolo',
  },
  'common.chooseName': {
    en: 'Choose your name',
    it: 'Scegli il tuo nome',
  },
  'common.enterPin': {
    en: 'Enter PIN',
    it: 'Inserisci PIN',
  },
  'common.pin': {
    en: 'PIN',
    it: 'PIN',
  },
  'common.join': {
    en: 'Join',
    it: 'Unisciti',
  },
  'common.createGame': {
    en: 'Create Game',
    it: 'Crea Gioco',
  },
  'common.startGame': {
    en: 'Start Game',
    it: 'Inizia Gioco',
  },
  'common.endGame': {
    en: 'End Game',
    it: 'Termina Gioco',
  },
  'common.players': {
    en: 'players',
    it: 'giocatori',
  },
  'common.firstNarrator': {
    en: 'First Narrator',
    it: 'Primo Narratore',
  },
  'common.waitingForPlayers': {
    en: 'Waiting for players',
    it: 'In attesa dei giocatori',
  },
  'common.waitingForPlayersToJoin': {
    en: 'Waiting for other players to join...',
    it: 'In attesa che altri giocatori si uniscano...',
  },
  'common.select': {
    en: 'Select',
    it: 'Seleziona',
  },
  'common.next': {
    en: 'Next',
    it: 'Avanti',
  },
  'common.back': {
    en: 'Back',
    it: 'Indietro',
  },
  'common.continue': {
    en: 'Continue',
    it: 'Continua',
  },
  'common.loading': {
    en: 'Loading...',
    it: 'Caricamento...',
  },
  'common.rules': {
    en: 'Rules',
    it: 'Regole',
  },
  'common.noGameSelected': {
    en: 'No game selected',
    it: 'Nessun gioco selezionato',
  },
  'common.musicEnabled': {
    en: 'Music Enabled',
    it: 'Musica Attivata',
  },
  'common.musicDisabled': {
    en: 'Music Disabled',
    it: 'Musica Disattivata',
  },
  'common.musicEnabledDesc': {
    en: 'Background music has been turned on.',
    it: 'La musica di sottofondo è stata attivata.',
  },
  'common.musicDisabledDesc': {
    en: 'Background music has been turned off.',
    it: 'La musica di sottofondo è stata disattivata.',
  },
  'common.playMusic': {
    en: 'Play music',
    it: 'Riproduci musica',
  },
  'common.muteMusic': {
    en: 'Mute music',
    it: 'Silenzia musica',
  },

  'trivia.yourTurn': {
    en: "It's your turn to answer!",
    it: "È il tuo turno di rispondere!",
  },
  'trivia.playerAnswering': {
    en: "is answering...",
    it: "sta rispondendo...",
  },
  'trivia.correct': {
    en: "Correct answer!",
    it: "Risposta corretta!",
  },
  'trivia.wrong': {
    en: "Wrong answer",
    it: "Risposta sbagliata",
  },
  'trivia.waitingForQuestion': {
    en: "Waiting for the narrator to show the question...",
    it: "In attesa che il narratore mostri la domanda...",
  },

  // ← NEW: localized seconds label with interpolation
  'trivia.seconds': {
    en: '{{count}} seconds',
    it: '{{count}} secondi',
  },

  // NEW: Language mismatch error messages
  'error.languageMismatch.italian': {
    en: 'This game was created in Italian. Please go to the Italian Trivia page to join.',
    it: 'Questo gioco è stato creato in italiano. Per unirti, vai alla pagina Trivia Italiana.',
  },
  'error.languageMismatch.english': {
    en: 'This game was created in English. Please go to the English Trivia page to join.',
    it: 'Questo gioco è stato creato in inglese. Per unirti, vai alla pagina Trivia Inglese.',
  },

  // Game status error messages
  'error.gameAlreadyStarted': {
    en: 'This game has already started and cannot accept new players.',
    it: 'Questo gioco è già iniziato e non può accettare nuovi giocatori.',
  },
  'error.gameNotAvailable': {
    en: 'This game is no longer available.',
    it: 'Questo gioco non è più disponibile.',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /**
   * t(key, opts?) accepts an optional { count } to replace `{{count}}` in the string.
   */
  t: (key: string, opts?: { count?: number }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to Italian
  const [language, setLanguage] = useState<Language>('it');

  const t = (key: string, opts?: { count?: number }): string => {
    const entry = translations[key];
    if (!entry) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    let text = entry[language];
    if (opts?.count != null) {
      // simple interpolation of {{count}}
      text = text.replace('{{count}}', String(opts.count));
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
