
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
  /* …all your existing keys… */

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
