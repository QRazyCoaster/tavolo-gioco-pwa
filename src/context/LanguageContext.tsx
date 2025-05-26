
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
  // Common translations
  'common.chooseLanguage': {
    en: 'Choose Language',
    it: 'Scegli Lingua',
  },
  'common.chooseRole': {
    en: 'Choose Your Role',
    it: 'Scegli il Tuo Ruolo',
  },
  'common.enterPin': {
    en: 'Enter Game PIN',
    it: 'Inserisci PIN del Gioco',
  },
  'common.chooseName': {
    en: 'Choose Your Name',
    it: 'Scegli il Tuo Nome',
  },
  'common.join': {
    en: 'Join Game',
    it: 'Unisciti al Gioco',
  },
  'common.back': {
    en: 'Back',
    it: 'Indietro',
  },
  'common.continue': {
    en: 'Continue',
    it: 'Continua',
  },
  'common.next': {
    en: 'Next',
    it: 'Avanti',
  },
  'common.loading': {
    en: 'Loading...',
    it: 'Caricamento...',
  },
  'common.players': {
    en: 'players',
    it: 'giocatori',
  },
  'common.select': {
    en: 'Select',
    it: 'Seleziona',
  },
  'common.createGame': {
    en: 'Create Game',
    it: 'Crea Gioco',
  },
  'common.pin': {
    en: 'PIN',
    it: 'PIN',
  },
  'common.waitingForPlayers': {
    en: 'Waiting for Players',
    it: 'In Attesa di Giocatori',
  },
  'common.waitingForPlayersToJoin': {
    en: 'Waiting for other players to join...',
    it: 'In attesa che altri giocatori si uniscano...',
  },
  'common.startGame': {
    en: 'Start Game',
    it: 'Inizia Gioco',
  },
  'common.firstNarrator': {
    en: 'First Narrator',
    it: '1° Narratore',
  },
  'common.rules': {
    en: 'Rules',
    it: 'Regole',
  },
  'common.noGameSelected': {
    en: 'No game selected',
    it: 'Nessun gioco selezionato',
  },

  // Games
  'games.trivia': {
    en: 'Trivia Challenge',
    it: 'Sfida Trivia',
  },
  'games.bottleGame': {
    en: 'Word Association',
    it: 'Associazione di Parole',
  },

  // Trivia specific
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
  'trivia.seconds': {
    en: '{{count}} seconds',
    it: '{{count}} secondi',
  },

  // Language mismatch error messages
  'error.languageMismatch.italian': {
    en: 'This game was created in Italian. Please go to the Italian Trivia page to join.',
    it: 'Questo gioco è stato creato in italiano. Per unirti, vai alla pagina Trivia Italiana.',
  },
  'error.languageMismatch.english': {
    en: 'This game was created in English. Please go to the English Trivia page to join.',
    it: 'Questo gioco è stato creato in inglese. Per unirti, vai alla pagina Trivia Inglese.',
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
