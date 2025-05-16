
import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { TriviaQuestion, PlayerAnswer, Round } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';

// Domande demo per test (da sostituire con quelle da Supabase)
const mockQuestions: TriviaQuestion[] = [
  {
    id: '1',
    textEn: 'What is the capital of France?',
    textIt: 'Qual è la capitale della Francia?',
    answerEn: 'Paris',
    answerIt: 'Parigi',
    categoryId: 'geography',
    difficulty: 'easy'
  },
  {
    id: '2',
    textEn: 'Who painted the Mona Lisa?',
    textIt: 'Chi ha dipinto la Monna Lisa?',
    answerEn: 'Leonardo da Vinci',
    answerIt: 'Leonardo da Vinci',
    categoryId: 'art',
    difficulty: 'easy'
  },
  {
    id: '3',
    textEn: 'What is the chemical symbol for water?',
    textIt: 'Qual è il simbolo chimico dell\'acqua?',
    answerEn: 'H2O',
    answerIt: 'H2O',
    categoryId: 'science',
    difficulty: 'easy'
  },
  {
    id: '4',
    textEn: 'What planet is known as the Red Planet?',
    textIt: 'Quale pianeta è conosciuto come il Pianeta Rosso?',
    answerEn: 'Mars',
    answerIt: 'Marte',
    categoryId: 'astronomy',
    difficulty: 'easy'
  },
  {
    id: '5',
    textEn: 'Who wrote "Romeo and Juliet"?',
    textIt: 'Chi ha scritto "Romeo e Giulietta"?',
    answerEn: 'William Shakespeare',
    answerIt: 'William Shakespeare',
    categoryId: 'literature',
    difficulty: 'easy'
  }
];

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
  const [showPendingAnswers, setShowPendingAnswers] = useState<boolean>(true);
  
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
  
  // Debug logging for player answers
  useEffect(() => {
    if (currentRound.playerAnswers.length > 0) {
      console.log('[useTriviaGame] Player answers updated:', currentRound.playerAnswers);
      console.log('[useTriviaGame] Current player answering:', 
        currentRound.playerAnswers[0]?.playerName || "None");
      
      // Ensure showPendingAnswers is true when we have player answers
      if (!showPendingAnswers) {
        console.log('[useTriviaGame] Setting showPendingAnswers to true');
        setShowPendingAnswers(true);
      }
    }
  }, [currentRound.playerAnswers, showPendingAnswers]);
  
  // Gestisce la prenotazione di un giocatore per rispondere
  const handlePlayerBuzzer = useCallback(() => {
    if (!state.currentPlayer || isNarrator || hasPlayerAnswered) {
      console.log('[useTriviaGame] Cannot buzz: player conditions not met', { 
        currentPlayer: !!state.currentPlayer, 
        isNarrator, 
        hasAnswered: hasPlayerAnswered 
      });
      return;
    }
    
    console.log('[useTriviaGame] Player buzzer pressed:', state.currentPlayer.name);
    
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
      // Ensure we're not adding duplicates
      const playerAlreadyAnswered = prev.playerAnswers.some(p => p.playerId === state.currentPlayer?.id);
      if (playerAlreadyAnswered) {
        console.log('[useTriviaGame] Player already answered, not adding again');
        return prev;
      }
      
      const updatedAnswers = [...prev.playerAnswers, newPlayerAnswer];
      console.log('[useTriviaGame] Updated player answers array:', updatedAnswers);
      
      // Force update the showPendingAnswers state
      if (updatedAnswers.length > 0) {
        setShowPendingAnswers(true);
      }
      
      return {
        ...prev,
        playerAnswers: updatedAnswers
      };
    });
    
  }, [state.currentPlayer, isNarrator, hasPlayerAnswered]);
  
  // Gestisce la risposta corretta di un giocatore
  const handleCorrectAnswer = useCallback((playerId: string) => {
    console.log('[useTriviaGame] Handling correct answer for player:', playerId);
    
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
      console.log('[useTriviaGame] Moving to next question after correct answer');
      
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
    setShowPendingAnswers(false);
    
  }, [state.players, dispatch]);
  
  // Gestisce la risposta errata di un giocatore
  const handleWrongAnswer = useCallback((playerId: string) => {
    console.log('[useTriviaGame] Handling wrong answer for player:', playerId);
    
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
      console.log('[useTriviaGame] Player removed after wrong answer, remaining players:', updatedPlayerAnswers);
      
      return {
        ...prev,
        playerAnswers: updatedPlayerAnswers
      };
    });
    
  }, [state.players, dispatch]);
  
  // Gestisce il passaggio manuale alla domanda successiva
  const handleNextQuestion = useCallback(() => {
    console.log('[useTriviaGame] Moving to next question manually');
    
    setCurrentRound(prev => {
      // Se siamo all'ultima domanda, rimaniamo su quella
      if (prev.currentQuestionIndex >= prev.questions.length - 1) {
        console.log('[useTriviaGame] Already at last question, resetting answers');
        return {
          ...prev,
          playerAnswers: [],
          timeLeft: QUESTION_TIMER
        };
      }
      
      // Altrimenti, passa alla prossima domanda
      console.log('[useTriviaGame] Moving to next question', prev.currentQuestionIndex + 1);
      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      };
    });
    
    // Resetta i giocatori che hanno risposto per la nuova domanda
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
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
    showPendingAnswers,
    setShowPendingAnswers,
    handlePlayerBuzzer,
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion,
  };
};
