
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

/* ──────────────── Player type ──────────────── */
export interface Player {
  id: string;
  name: string;
  /**
   * isHost: Indicates if this player is the game creator (permanent role)
   * This is different from the narrator role which rotates each round
   */
  isHost: boolean;
  score?: number;
  buzzer_sound_url?: string;
  /**
   * narrator_order: Determines when this player will be the narrator
   * Lower numbers go first (host is typically 1)
   */
  narrator_order?: number;
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
  lastUpdate?: number; // Timestamp for tracking UI refreshes
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
  lastUpdate: Date.now(),
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
  | { type: 'REFRESH_UI'; payload: number }; // Action to force UI updates

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
        lastUpdate: Date.now(),
      };
    case 'JOIN_GAME':
      return {
        ...state,
        gameId: action.payload.gameId,
        pin: action.payload.pin,
        currentPlayer: action.payload.player,
        players: [...state.players, action.payload.player],
        lastUpdate: Date.now(),
      };
    case 'ADD_PLAYER':
      return { 
        ...state, 
        players: [...state.players, action.payload],
        lastUpdate: Date.now(),
      };
    case 'ADD_PLAYER_LIST':
      return { 
        ...state, 
        players: action.payload,
        lastUpdate: Date.now(), 
      };
    case 'REMOVE_PLAYER':
      return { 
        ...state, 
        players: state.players.filter(p => p.id !== action.payload),
        lastUpdate: Date.now(),
      };
    case 'SELECT_GAME':
      return { 
        ...state, 
        selectedGame: action.payload,
        lastUpdate: Date.now(),
      };
    case 'START_GAME':
      return { 
        ...state, 
        gameStarted: true,
        lastUpdate: Date.now(),
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
        lastUpdate: Date.now(),
      };
    case 'UPDATE_SCORE': {
      console.log(`[gameReducer] Updating score for player ${action.payload.playerId} to ${action.payload.score}`);
      
      // Find the player in the current state
      const playerToUpdate = state.players.find(p => p.id === action.payload.playerId);
      
      // If player exists and score is different, update it
      if (playerToUpdate && playerToUpdate.score !== action.payload.score) {
        return {
          ...state,
          players: state.players.map(p =>
            p.id === action.payload.playerId ? { ...p, score: action.payload.score } : p
          ),
          lastUpdate: Date.now(),
        };
      }
      
      // If player doesn't exist or score isn't changing, return current state
      return state;
    }
    case 'SET_CURRENT_PLAYER':
      return { 
        ...state, 
        currentPlayer: action.payload,
        lastUpdate: Date.now(), 
      };
    case 'START_BACKGROUND_MUSIC':
      return { 
        ...state, 
        backgroundMusicPlaying: true,
        lastUpdate: Date.now(), 
      };
    case 'STOP_BACKGROUND_MUSIC':
      return { 
        ...state, 
        backgroundMusicPlaying: false,
        lastUpdate: Date.now(), 
      };
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
          selectedGame: selectedGame || state.selectedGame,
          lastUpdate: Date.now(),
        };
      }
      return state;
    case 'REFRESH_UI':
      // This action just updates lastUpdate to trigger re-renders
      console.log(`[gameReducer] Forcing UI refresh with timestamp ${action.payload}`);
      return { ...state, lastUpdate: action.payload };
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
