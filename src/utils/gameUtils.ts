
/**
 * Generates a random game PIN (4 digits)
 */
export const generateGamePin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Generates a unique ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Mock function to simulate real-time communication
 * In a real app, this would use WebSockets or another real-time technology
 */
export const broadcastGameUpdate = (gameId: string, data: any): void => {
  // In a real app, this would send the update to all connected clients
  console.log(`Broadcasting update for game ${gameId}:`, data);
  
  // For demonstration purposes, we'll just use localStorage to simulate
  // a simple real-time communication mechanism
  try {
    const gameUpdates = JSON.parse(localStorage.getItem('gameUpdates') || '{}');
    gameUpdates[gameId] = {
      ...gameUpdates[gameId],
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem('gameUpdates', JSON.stringify(gameUpdates));
  } catch (error) {
    console.error('Error broadcasting game update:', error);
  }
};

/**
 * Available games
 */
export const availableGames = [
  {
    id: 'trivia',
    nameEn: 'Trivia Challenge',
    nameIt: 'Sfida Trivia',
    descriptionEn: 'Test your knowledge with various questions',
    descriptionIt: 'Metti alla prova le tue conoscenze con varie domande',
    minPlayers: 2,
    maxPlayers: 8,
  },
  {
    id: 'wordgame',
    nameEn: 'Word Association',
    nameIt: 'Associazione di Parole',
    descriptionEn: 'Find words related to a given theme',
    descriptionIt: 'Trova parole relazionate a un tema dato',
    minPlayers: 2,
    maxPlayers: 6,
  },
];
