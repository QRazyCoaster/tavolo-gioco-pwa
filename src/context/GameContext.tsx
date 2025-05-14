
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

/* ──────────────── Player type ──────────────── */
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score?: number;
  buzzer_sound_url?: string;   // ← nuovo campo
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
  | { type: 'RESTORE_SESSION' };

/* ──────────────── Reducer ──────────────── */
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CREATE_GAME':
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
      return { ...state, gameStarted: true };
    case 'END_GAME':
      // Clear session storage on game end
      sessionStorage.removeItem('gameStarted');
      sessionStorage.removeItem('gameId');
      sessionStorage.removeItem('pin');
      sessionStorage.removeItem('selectedGame');
      return { ...state, gameStarted: false, selectedGame: null };
    case 'UPDATE_SCORE':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId ? { ...p, score: action.payload.score } : p
        ),
      };
    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayer: action.payload };
    case 'START_BACKGROUND_MUSIC':
      return { ...state, backgroundMusicPlaying: true };
    case 'STOP_BACKGROUND_MUSIC':
      return { ...state, backgroundMusicPlaying: false };
    case 'RESTORE_SESSION':
      // Check if we have session data to restore from
      const gameId = sessionStorage.getItem('gameId');
      const pin = sessionStorage.getItem('pin');
      const gameStarted = sessionStorage.getItem('gameStarted') === 'true';
      const selectedGame = sessionStorage.getItem('selectedGame') || 'trivia';
      
      // Only restore if we have valid session data
      if (gameId && pin && gameStarted) {
        console.log('GameContext - Restoring session:', { gameId, pin, gameStarted, selectedGame });
        return {
          ...state,
          gameId,
          pin,
          gameStarted,
          selectedGame
        };
      }
      return state;
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

  // On initial load, try to restore from session storage
  useEffect(() => {
    const gameId = sessionStorage.getItem('gameId');
    const pin = sessionStorage.getItem('pin');
    const gameStarted = sessionStorage.getItem('gameStarted') === 'true';
    
    if (gameId && pin && gameStarted && !state.gameId) {
      console.log('GameProvider - Attempting to restore session');
      dispatch({ type: 'RESTORE_SESSION' });
    }
  }, [state.gameId]);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
};

/* ──────────────── Hook ──────────────── */
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
