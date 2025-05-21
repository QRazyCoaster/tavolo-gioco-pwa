// src/context/GameContext.tsx

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

/* ──────────────── Player type ──────────────── */
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score?: number;
  buzzer_sound_url?: string;
  narrator_order?: number;           // ← added
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

/* ──────────────── Helper: sort by narrator_order ──────────────── */
function sortByNarrator(a: Player, b: Player) {
  const na = a.narrator_order ?? 0;
  const nb = b.narrator_order ?? 0;
  return na - nb;
}

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
    case 'CREATE_GAME': {
      sessionStorage.setItem('gameId', action.payload.gameId);
      sessionStorage.setItem('pin', action.payload.pin);
      const host = action.payload.host;
      return {
        ...state,
        gameId: action.payload.gameId,
        pin: action.payload.pin,
        players: [host].sort(sortByNarrator),
        currentPlayer: host,
      };
    }
    case 'JOIN_GAME': {
      const updated = [...state.players, action.payload.player].sort(sortByNarrator);
      return {
        ...state,
        gameId: action.payload.gameId,
        pin: action.payload.pin,
        currentPlayer: action.payload.player,
        players: updated,
      };
    }
    case 'ADD_PLAYER': {
      return { ...state, players: [...state.players, action.payload].sort(sortByNarrator) };
    }
    case 'ADD_PLAYER_LIST': {
      return { ...state, players: [...action.payload].sort(sortByNarrator) };
    }
    case 'REMOVE_PLAYER': {
      const filtered = state.players.filter(p => p.id !== action.payload);
      return { ...state, players: filtered.sort(sortByNarrator) };
    }
    case 'SELECT_GAME':
      return { ...state, selectedGame: action.payload };
    case 'START_GAME':
      return { ...state, gameStarted: true };
    case 'END_GAME':
      sessionStorage.removeItem('gameStarted');
      sessionStorage.removeItem('gameId');
      sessionStorage.removeItem('pin');
      sessionStorage.removeItem('selectedGame');
      return { ...state, gameStarted: false, selectedGame: null, gameId: null, pin: null };
    case 'UPDATE_SCORE':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.payload.playerId ? { ...p, score: action.payload.score } : p
        ).sort(sortByNarrator),
      };
    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayer: action.payload };
    case 'START_BACKGROUND_MUSIC':
      return { ...state, backgroundMusicPlaying: true };
    case 'STOP_BACKGROUND_MUSIC':
      return { ...state, backgroundMusicPlaying: false };
    case 'RESTORE_SESSION': {
      const gameId = sessionStorage.getItem('gameId');
      const pin = sessionStorage.getItem('pin');
      const gameStarted = sessionStorage.getItem('gameStarted') === 'true';
      const selectedGame = sessionStorage.getItem('selectedGame');
      if (gameId && pin) {
        return {
          ...state,
          gameId,
          pin,
          gameStarted,
          selectedGame: selectedGame || state.selectedGame
        };
      }
      return state;
    }
    default:
      return state;
  }
}

/* ──────────────── Context & Provider ──────────────── */
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    const gameId = sessionStorage.getItem('gameId');
    const pin = sessionStorage.getItem('pin');
    if (gameId && pin && !state.gameId) {
      dispatch({ type: 'RESTORE_SESSION' });
    }
  }, [state.gameId]);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextType => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
