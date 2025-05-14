
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Button } from "@/components/ui/button";
import { playAudio } from '@/utils/audioUtils';
import TriviaGame from '@/components/games/TriviaGame';
import { useToast } from '@/hooks/use-toast';

const GamePage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  
  const handleEndGame = () => {
    dispatch({ type: 'END_GAME' });
    playAudio('notification');
    navigate('/');
  };
  
  // Migliorata la logica di gestione dello stato della sessione
  useEffect(() => {
    console.log('GamePage - Game state values:', {
      gameId: state.gameId,
      pin: state.pin,
      gameStarted: state.gameStarted,
      selectedGame: state.selectedGame,
      playersCount: state.players.length
    });
    
    // Ottieni prima i valori della sessione
    const sessionGameStarted = sessionStorage.getItem('gameStarted') === 'true';
    const sessionGameId = sessionStorage.getItem('gameId');
    const sessionPin = sessionStorage.getItem('pin');
    const sessionSelectedGame = sessionStorage.getItem('selectedGame');
    
    console.log('GamePage - Session storage values:', {
      sessionGameStarted,
      sessionGameId,
      sessionPin,
      sessionSelectedGame
    });
    
    // Se abbiamo i valori dello stato e della sessione, prioritizziamo lo stato
    if (state.gameId && state.pin && state.gameStarted) {
      console.log('GamePage - Utilizzo lo stato del gioco dal contesto');
      
      // Aggiorna la sessionStorage con lo stato corrente
      sessionStorage.setItem('gameStarted', 'true');
      sessionStorage.setItem('gameId', state.gameId);
      sessionStorage.setItem('pin', state.pin);
      if (state.selectedGame) {
        sessionStorage.setItem('selectedGame', state.selectedGame);
      } else {
        // Imposta un gioco predefinito se non è stato selezionato
        dispatch({ type: 'SELECT_GAME', payload: 'trivia' });
        sessionStorage.setItem('selectedGame', 'trivia');
      }
      
      // Non reindirizzare, abbiamo uno stato valido
      return;
    }
    
    // Se non abbiamo lo stato ma abbiamo i valori di sessione, recuperiamo dalla sessione
    if ((!state.gameId || !state.pin || !state.gameStarted) && 
        sessionGameStarted && sessionGameId && sessionPin) {
      console.log('GamePage - Recupero dallo storage di sessione');
      
      // Ripristina il gioco dalla sessione
      dispatch({ type: 'RESTORE_SESSION' });
      
      // Assicurati che il gioco sia avviato
      if (!state.gameStarted) {
        dispatch({ type: 'START_GAME' });
      }
      
      // Imposta il tipo di gioco se necessario
      if (!state.selectedGame && sessionSelectedGame) {
        dispatch({ type: 'SELECT_GAME', payload: sessionSelectedGame });
      } else if (!state.selectedGame) {
        dispatch({ type: 'SELECT_GAME', payload: 'trivia' });
      }
      
      toast({
        title: language === 'it' ? "Sessione ripristinata" : "Session restored",
        description: language === 'it' 
          ? "Sessione di gioco ripristinata con successo" 
          : "Game session successfully restored"
      });
      
      // Non reindirizzare, abbiamo recuperato lo stato
      return;
    }
    
    // Se non c'è stato nel contesto o nella sessionStorage, reindirizza alla home
    if ((!state.gameId || !state.pin || !state.gameStarted) && 
        (!sessionGameStarted || !sessionGameId || !sessionPin)) {
      console.log('GamePage - Nessuno stato di gioco nel contesto o nella sessione, reindirizzo alla home');
      toast({
        title: language === 'it' ? "Sessione non valida" : "Invalid session",
        description: language === 'it' 
          ? "Nessuna sessione di gioco attiva trovata" 
          : "No active game session found",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
    
  }, [state.gameId, state.pin, state.gameStarted, state.selectedGame, navigate, dispatch, language, toast]);
  
  // Se ancora non pronto, mostra il caricamento
  if (!state.gameId || !state.pin || !state.gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-medium mb-4">{language === 'it' ? "Caricamento del gioco..." : "Loading game..."}</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Renderizza il gioco in base al tipo selezionato
  const renderGame = () => {
    console.log('GamePage - Rendering game:', state.selectedGame);
    
    switch (state.selectedGame) {
      case 'trivia':
        return <TriviaGame />;
      case 'bottlegame':
        return (
          <div className="flex items-center justify-center p-10">
            <p className="text-xl font-semibold text-center">
              {language === 'it' 
                ? 'Gioco della Bottiglia in arrivo...' 
                : 'Bottle Game coming soon...'}
            </p>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center p-10">
            <p className="text-xl font-semibold text-center">
              {language === 'it' 
                ? 'Gioco non riconosciuto' 
                : 'Game not recognized'}
            </p>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Tavolo Gioco</h1>
        <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-lg text-center">
          <span className="text-sm font-semibold">{t('common.pin')}: </span>
          <span className="text-lg font-bold tracking-wider">{state.pin}</span>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-start">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-semibold">
            {state.selectedGame === 'trivia' 
              ? (language === 'it' ? 'Trivia' : 'Trivia') 
              : (language === 'it' ? 'Gioco della Bottiglia' : 'Bottle Game')}
          </h2>
        </div>
        
        {renderGame()}
        
        <div className="w-full max-w-md mt-6">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {state.players.map(player => (
              <div 
                key={player.id}
                className={`px-3 py-1 rounded-full text-white ${player.isHost ? 'bg-primary' : 'bg-secondary'}`}
              >
                {player.name}: {player.score || 0}
              </div>
            ))}
          </div>
          
          {state.currentPlayer?.isHost && (
            <Button 
              className="w-full mt-2" 
              variant="destructive"
              onClick={handleEndGame}
            >
              {t('common.endGame')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
