
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

/* ──────────────── Player type ──────────────── */
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score?: number;
  buzzer_sound_url?: string;
}

/* ──────────────── Game state ──────────────── */
export interface GameState {
  gameId: string | null;
  pin: string | null;
  players: Player[];
  selectedGame: string | null;
  gameStarted: boolean;
  currentPlayer: Player | null;
  backgroundMusicPlaying: boolean;
  originalNarratorQueue: string[]; // Original order of narrator rotation
  completedNarrators: Set<string>; // Players who have already been narrator
}

/* ──────────────── Initial state ──────────────── */
const initialState: GameState = {
  gameId: null,
  pin: null,
  players: [],
  selectedGame: null,
  gameStarted: false,
  currentPlayer: null,
  backgroundMusicPlaying: false,
  originalNarratorQueue: [],
  completedNarrators: new Set(),
};

/* ──────────────── Action types ──────────────── */
type GameAction =
  | { type: 'CREATE_GAME'; payload: { gameId: string; pin: string; host: Player } }
  | { type: 'JOIN_GAME'; payload: { gameId: string; pin: string; player: Player } }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'ADD_PLAYER_LIST'; payload: Player[] }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'SELECT_GAME'; payload: string }
  | { type: 'START_GAME' }
  | { type: 'END_GAME' }
  | { type: 'UPDATE_SCORE'; payload: { playerId: string; score: number } }
  | { type: 'SET_CURRENT_PLAYER'; payload: Player | null }
  | { type: 'START_BACKGROUND_MUSIC' }
  | { type: 'STOP_BACKGROUND_MUSIC' }
  | { type: 'RESTORE_SESSION' }
  | { type: 'INITIALIZE_NARRATOR_QUEUE'; payload: string[] }
  | { type: 'MARK_NARRATOR_COMPLETED'; payload: string };

/* ──────────────── Reducer ──────────────── */
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CREATE_GAME':
      // When creating a game, also store in sessionStorage for persistence
      sessionStorage.setItem('gameId', action.payload.gameId);
      sessionStorage.setItem('pin', action.payload.pin);
      console.log('GameContext - CREATE_GAME: Storing session data', {
        gameId: action.payload.gameId,
        pin: action.payload.pin
      });
      
      return {
        ...state,
        gameId: action.payload.gameId,
        pin: action.payload.pin,
        players: [action.payload.host],
        currentPlayer: action.payload.host,
      };
    case 'JOIN_GAME':
      return {
        ...state,
        gameId: action.payload.gameId,
        pin: action.payload.pin,
        currentPlayer: action.payload.player,
        players: [...state.players, action.payload.player],
      };
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] };
    case 'ADD_PLAYER_LIST':
      return { ...state, players: action.payload };
    case 'REMOVE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.payload) };
    case 'SELECT_GAME':
      return { ...state, selectedGame: action.payload };
    case 'START_GAME':
      // Initialize narrator queue with current players when game starts
      const narratorQueue = state.players.map(p => p.id);
      return { 
        ...state, 
        gameStarted: true,
        originalNarratorQueue: narratorQueue,
        completedNarrators: new Set()
      };
    case 'END_GAME':
      // Clear sessionStorage when the game ends
      sessionStorage.removeItem('gameStarted');
      sessionStorage.removeItem('gameId');
      sessionStorage.removeItem('pin');
      sessionStorage.removeItem('selectedGame');
      return { 
        ...state, 
        gameStarted: false, 
        selectedGame: null, 
        gameId: null, 
        pin: null,
        originalNarratorQueue: [],
        completedNarrators: new Set()
      };
    case 'UPDATE_SCORE':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId ? { ...p, score: action.payload.score } : p
        ),
      };
    case 'SET_CURRENT_PLAYER':
      // Also store current player in session storage for recovery
      if (action.payload) {
        sessionStorage.setItem('currentPlayerId', action.payload.id);
        sessionStorage.setItem('currentPlayerName', action.payload.name);
      } else {
        sessionStorage.removeItem('currentPlayerId');
        sessionStorage.removeItem('currentPlayerName');
      }
      return { ...state, currentPlayer: action.payload };
    case 'START_BACKGROUND_MUSIC':
      return { ...state, backgroundMusicPlaying: true };
    case 'STOP_BACKGROUND_MUSIC':
      return { ...state, backgroundMusicPlaying: false };
    case 'RESTORE_SESSION':
      // Check for session data to restore
      const gameId = sessionStorage.getItem('gameId');
      const pin = sessionStorage.getItem('pin');
      const gameStarted = sessionStorage.getItem('gameStarted') === 'true';
      const selectedGame = sessionStorage.getItem('selectedGame');
      
      // Only restore if we have valid session data
      if (gameId && pin) {
        console.log('GameContext - Restoring session:', { gameId, pin, gameStarted, selectedGame });
        return {
          ...state,
          gameId,
          pin,
          gameStarted: gameStarted || false,
          selectedGame: selectedGame || state.selectedGame
        };
      }
      return state;
    case 'INITIALIZE_NARRATOR_QUEUE':
      return {
        ...state,
        originalNarratorQueue: action.payload,
        completedNarrators: new Set()
      };
    case 'MARK_NARRATOR_COMPLETED':
      const newCompletedNarrators = new Set(state.completedNarrators);
      newCompletedNarrators.add(action.payload);
      return {
        ...state,
        completedNarrators: newCompletedNarrators
      };
    default:
      return state;
  }
}

/* ──────────────── Context ──────────────── */
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

/* ──────────────── Provider ──────────────── */
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Al caricamento iniziale, prova a ripristinare dalla sessionStorage
  useEffect(() => {
    const gameId = sessionStorage.getItem('gameId');
    const pin = sessionStorage.getItem('pin');
    
    if (gameId && pin && !state.gameId) {
      console.log('GameProvider - Tentativo di ripristino della sessione', { gameId, pin });
      dispatch({ type: 'RESTORE_SESSION' });
    }
  }, []);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
};

/* ──────────────── Hook ──────────────── */
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
