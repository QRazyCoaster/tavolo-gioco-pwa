import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { TriviaQuestion, PlayerAnswer, Round } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';

// Domande demo per test (da sostituire con quelle da Supabase)
// ... keep existing code (mockQuestions array)

// Durata del timer in secondi
const QUESTION_TIMER = 90;

export const useTriviaGame = () => {
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  
  const [currentRound, setCurrentRound] = useState<Round>({
    roundNumber: 1,
    narratorId: state.players.find(p => p.isHost)?.id || '',
    questions: mockQuestions,
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER
  });
  
  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set());
  
  // Determina se il giocatore corrente è il narratore
  const isNarrator = state.currentPlayer?.id === currentRound.narratorId;
  
  // Determina se il giocatore corrente ha già risposto alla domanda corrente
  const hasPlayerAnswered = state.currentPlayer 
    ? answeredPlayers.has(state.currentPlayer.id)
    : false;
  
  // Timer per la domanda corrente
  useEffect(() => {
    if (!isNarrator) return;
    
    const timer = setInterval(() => {
      setCurrentRound(prev => ({
        ...prev,
        timeLeft: Math.max(0, prev.timeLeft - 1)
      }));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isNarrator]);
  
  // Gestisce la prenotazione di un giocatore per rispondere
  const handlePlayerBuzzer = useCallback(() => {
    if (!state.currentPlayer || isNarrator || hasPlayerAnswered) {
      console.log('Cannot buzz: player conditions not met', { 
        currentPlayer: !!state.currentPlayer, 
        isNarrator, 
        hasAnswered: hasPlayerAnswered 
      });
      return;
    }
    
    console.log('Player buzzer pressed:', state.currentPlayer.name);
    
    // Play buzzer sound immediately
    if (window.myBuzzer) {
      window.myBuzzer.play().catch(() => {
        playAudio('buzzer');
      });
    } else {
      playAudio('buzzer');
    }
    
    // Create the new player answer object
    const newPlayerAnswer: PlayerAnswer = {
      playerId: state.currentPlayer.id,
      playerName: state.currentPlayer.name,
      timestamp: Date.now()
    };
    
    // Add player to answeredPlayers set
    setAnsweredPlayers(prev => {
      const newSet = new Set(prev);
      newSet.add(state.currentPlayer!.id);
      return newSet;
    });
    
    // Update the currentRound with the new player answer
    setCurrentRound(prev => {
      const updatedAnswers = [...prev.playerAnswers, newPlayerAnswer];
      console.log('Updated player answers array:', updatedAnswers);
      return {
        ...prev,
        playerAnswers: updatedAnswers
      };
    });
    
  }, [state.currentPlayer, isNarrator, hasPlayerAnswered]);
  
  // Gestisce la risposta corretta di un giocatore
  const handleCorrectAnswer = useCallback((playerId: string) => {
    // Assegna 10 punti al giocatore
    dispatch({
      type: 'UPDATE_SCORE',
      payload: {
        playerId,
        score: (state.players.find(p => p.id === playerId)?.score || 0) + 10
      }
    });
    
    // Passa alla domanda successiva
    setCurrentRound(prev => {
      // Se siamo all'ultima domanda, rimaniamo su quella
      if (prev.currentQuestionIndex >= prev.questions.length - 1) {
        return {
          ...prev,
          playerAnswers: [],
          timeLeft: QUESTION_TIMER
        };
      }
      
      // Altrimenti, passa alla prossima domanda
      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      };
    });
    
    // Resetta i giocatori che hanno risposto per la nuova domanda
    setAnsweredPlayers(new Set());
    
  }, [state.players, dispatch]);
  
  // Gestisce la risposta errata di un giocatore
  const handleWrongAnswer = useCallback((playerId: string) => {
    // Sottrai 5 punti al giocatore
    dispatch({
      type: 'UPDATE_SCORE',
      payload: {
        playerId,
        score: Math.max(0, (state.players.find(p => p.id === playerId)?.score || 0) - 5)
      }
    });
    
    // Rimuovi solo il giocatore corrente dalla lista dei prenotati
    // lasciando gli altri in coda per rispondere
    setCurrentRound(prev => {
      const updatedPlayerAnswers = prev.playerAnswers.filter(ans => ans.playerId !== playerId);
      console.log('Player removed after wrong answer, remaining players:', updatedPlayerAnswers);
      
      return {
        ...prev,
        playerAnswers: updatedPlayerAnswers
      };
    });
    
  }, [state.players, dispatch]);
  
  // Gestisce il passaggio manuale alla domanda successiva
  const handleNextQuestion = useCallback(() => {
    setCurrentRound(prev => {
      // Se siamo all'ultima domanda, rimaniamo su quella
      if (prev.currentQuestionIndex >= prev.questions.length - 1) {
        return {
          ...prev,
          playerAnswers: [],
          timeLeft: QUESTION_TIMER
        };
      }
      
      // Altrimenti, passa alla prossima domanda
      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      };
    });
    
    // Resetta i giocatori che hanno risposto per la nuova domanda
    setAnsweredPlayers(new Set());
    playAudio('notification');
    
  }, []);
  
  return {
    currentRound,
    isNarrator,
    hasPlayerAnswered,
    currentQuestion: currentRound.questions[currentRound.currentQuestionIndex],
    questionNumber: currentRound.currentQuestionIndex + 1,
    totalQuestions: currentRound.questions.length,
    playerAnswers: currentRound.playerAnswers,
    timeLeft: currentRound.timeLeft,
    handlePlayerBuzzer,
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion,
  };
};
