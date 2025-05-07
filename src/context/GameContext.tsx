
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Player type
export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score?: number;
}

// Game state interface
export interface GameState {
  gameId: string | null;
  pin: string | null;
  players: Player[];
  selectedGame: string | null;
  gameStarted: boolean;
  currentPlayer: Player | null;
}

// Initial state
const initialState: GameState = {
  gameId: null,
  pin: null,
  players: [],
  selectedGame: null,
  gameStarted: false,
  currentPlayer: null,
};

// Action types
type GameAction =
  | { type: 'CREATE_GAME'; payload: { gameId: string; pin: string; host: Player } }
  | { type: 'JOIN_GAME'; payload: { gameId: string; pin: string; player: Player } }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'SELECT_GAME'; payload: string }
  | { type: 'START_GAME' }
  | { type: 'END_GAME' }
  | { type: 'UPDATE_SCORE'; payload: { playerId: string; score: number } }
  | { type: 'SET_CURRENT_PLAYER'; payload: Player | null };

// Reducer function
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
      // In a real app, we would validate the game ID and PIN here
      return {
        ...state,
        gameId: action.payload.gameId,
        pin: action.payload.pin,
        currentPlayer: action.payload.player,
        players: [...state.players, action.payload.player],
      };
    case 'ADD_PLAYER':
      return {
        ...state,
        players: [...state.players, action.payload],
      };
    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter(player => player.id !== action.payload),
      };
    case 'SELECT_GAME':
      return {
        ...state,
        selectedGame: action.payload,
      };
    case 'START_GAME':
      return {
        ...state,
        gameStarted: true,
      };
    case 'END_GAME':
      return {
        ...state,
        gameStarted: false,
        selectedGame: null,
      };
    case 'UPDATE_SCORE':
      return {
        ...state,
        players: state.players.map(player =>
          player.id === action.payload.playerId
            ? { ...player, score: action.payload.score }
            : player
        ),
      };
    case 'SET_CURRENT_PLAYER':
      return {
        ...state,
        currentPlayer: action.payload,
      };
    default:
      return state;
  }
}

// Context
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

// Hook for using game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
