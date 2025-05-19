
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
  'common.welcome': {
    en: 'Welcome to QRazy Coaster',
    it: 'Benvenuto a QRazy Coaster',
  },
  'common.createGame': {
    en: 'Create Game',
    it: 'Crea Partita',
  },
  'common.joinGame': {
    en: 'Join Game',
    it: 'Unisciti alla Partita',
  },
  'common.rules': {
    en: 'Rules',
    it: 'Regole',
  },
  'common.start': {
    en: 'Start',
    it: 'Inizia',
  },
  'common.startGame': {
    en: 'START GAME',
    it: 'INIZIA PARTITA',
  },
  'common.back': {
    en: 'Back',
    it: 'Indietro',
  },
  'common.next': {
    en: 'Next',
    it: 'Avanti',
  },
  'common.confirm': {
    en: 'Confirm',
    it: 'Conferma',
  },
  'common.cancel': {
    en: 'Cancel',
    it: 'Annulla',
  },
  'common.submit': {
    en: 'Submit',
    it: 'Invia',
  },
  'common.loading': {
    en: 'Loading...',
    it: 'Caricamento...',
  },
  'common.success': {
    en: 'Success!',
    it: 'Successo!',
  },
  'common.error': {
    en: 'Error',
    it: 'Errore',
  },
  'common.yes': {
    en: 'Yes',
    it: 'Sì',
  },
  'common.no': {
    en: 'No',
    it: 'No',
  },
  'common.continue': {
    en: 'Continue',
    it: 'Continua',
  },
  'common.gamePin': {
    en: 'Game PIN',
    it: 'PIN Partita',
  },
  'common.pin': {
    en: 'PIN',
    it: 'PIN',
  },
  'common.playerName': {
    en: 'Player Name',
    it: 'Nome Giocatore',
  },
  'common.host': {
    en: 'Host',
    it: 'Narratore',
  },
  'common.firstNarrator': {
    en: '1st Narrator',
    it: '1° Narratore',
  },
  'common.waitingForHost': {
    en: 'Waiting for the host...',
    it: 'In attesa del narratore...',
  },
  'common.waitingForPlayers': {
    en: 'Waiting for players to join...',
    it: 'In attesa che i giocatori si uniscano...',
  },
  'common.waitingForPlayersToJoin': {
    en: 'Waiting for more players to join...',
    it: 'In attesa che altri giocatori si uniscano...',
  },
  'common.players': {
    en: 'Players',
    it: 'Giocatori',
  },
  'common.score': {
    en: 'Score',
    it: 'Punteggio',
  },
  'common.round': {
    en: 'Round',
    it: 'Round',
  },
  'common.yourTurn': {
    en: 'Your turn',
    it: 'È il tuo turno',
  },
  'common.waitingForTurn': {
    en: 'Waiting for your turn',
    it: 'In attesa del tuo turno',
  },
  'common.gameOver': {
    en: 'Game Over',
    it: 'Fine della Partita',
  },
  'common.winner': {
    en: 'Winner',
    it: 'Vincitore',
  },
  'common.playAgain': {
    en: 'Play Again',
    it: 'Gioca Ancora',
  },
  'common.exitGame': {
    en: 'Exit Game',
    it: 'Esci dal Gioco',
  },
  'common.selectGame': {
    en: 'Select a Game',
    it: 'Seleziona un Gioco',
  },
  'common.invalidPin': {
    en: 'Invalid PIN',
    it: 'PIN non valido',
  },
  'common.nameTooShort': {
    en: 'Name must be at least 2 characters',
    it: 'Il nome deve avere almeno 2 caratteri',
  },
  'common.enterPin': {
    en: 'Enter the 4-digit PIN',
    it: 'Inserisci il PIN di 4 cifre',
  },
  'common.enterName': {
    en: 'Enter your name',
    it: 'Inserisci il tuo nome',
  },
  'common.chooseRole': {
    en: 'Choose your role',
    it: 'Scegli il tuo ruolo',
  },
  'common.errorJoiningGame': {
    en: 'Error joining game',
    it: 'Errore nell\'unirsi alla partita',
  },
  'common.errorCreatingGame': {
    en: 'Error creating game',
    it: 'Errore nella creazione della partita',
  },
  'common.endGame': {
    en: 'Exit Game',
    it: 'Esci dal Gioco',
  },
  'common.playMusic': {
    en: 'Play Music',
    it: 'Attiva Musica',
  },
  'common.muteMusic': {
    en: 'Mute Music',
    it: 'Disattiva Musica',
  },
  'common.chooseLanguage': {
    en: 'Choose Language',
    it: 'Scegli Lingua',
  },
  'common.chooseName': {
    en: 'Choose your name',
    it: 'Scegli il tuo nome',
  },
  'common.join': {
    en: 'Join',
    it: 'Unisciti',
  },
  'rules.title': {
    en: 'Game Rules',
    it: 'Regole del Gioco',
  },
  'rules.description': {
    en: 'Learn how to play our games',
    it: 'Impara come giocare ai nostri giochi',
  },
  'games.trivia': {
    en: 'Trivia Game',
    it: 'Gioco Trivia',
  },
  'games.bottleGame': {
    en: 'Bottle Game',
    it: 'Gioco della Bottiglia',
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
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to Italian
  const [language, setLanguage] = useState<Language>('it');

  const t = (key: string): string => {
    if (!translations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translations[key][language];
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

