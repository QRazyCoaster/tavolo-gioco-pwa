import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { TriviaQuestion, PlayerAnswer, Round } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';

// Domande demo per test (da sostituire con quelle da Supabase)
const mockQuestions: TriviaQuestion[] = [
  {
    id: '1',
    categoryId: 'science',
    textEn: 'What is the chemical symbol for gold?',
    textIt: 'Qual è il simbolo chimico dell\'oro?',
    answerEn: 'Au',
    answerIt: 'Au',
    difficulty: 'easy',
  },
  {
    id: '2',
    categoryId: 'geography',
    textEn: 'Which is the largest ocean on Earth?',
    textIt: 'Qual è l\'oceano più grande della Terra?',
    answerEn: 'Pacific Ocean',
    answerIt: 'Oceano Pacifico',
    difficulty: 'easy',
  },
  {
    id: '3',
    categoryId: 'history',
    textEn: 'In which year did Christopher Columbus first reach the Americas?',
    textIt: 'In quale anno Cristoforo Colombo raggiunse per la prima volta le Americhe?',
    answerEn: '1492',
    answerIt: '1492',
    difficulty: 'medium',
  },
  {
    id: '4',
    categoryId: 'arts',
    textEn: 'Who painted the Mona Lisa?',
    textIt: 'Chi ha dipinto la Gioconda?',
    answerEn: 'Leonardo da Vinci',
    answerIt: 'Leonardo da Vinci',
    difficulty: 'easy',
  },
  {
    id: '5',
    categoryId: 'sports',
    textEn: 'Which country won the FIFA World Cup in 2018?',
    textIt: 'Quale paese ha vinto la Coppa del Mondo FIFA nel 2018?',
    answerEn: 'France',
    answerIt: 'Francia',
    difficulty: 'medium',
  },
  {
    id: '6',
    categoryId: 'entertainment',
    textEn: 'Which actor played Jack Dawson in the movie "Titanic"?',
    textIt: 'Quale attore ha interpretato Jack Dawson nel film "Titanic"?',
    answerEn: 'Leonardo DiCaprio',
    answerIt: 'Leonardo DiCaprio',
    difficulty: 'easy',
  },
  {
    id: '7',
    categoryId: 'technology',
    textEn: 'Who is known as the co-founder of Microsoft?',
    textIt: 'Chi è conosciuto come il co-fondatore di Microsoft?',
    answerEn: 'Bill Gates',
    answerIt: 'Bill Gates',
    difficulty: 'easy',
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
    if (!state.currentPlayer || isNarrator || hasPlayerAnswered) return;
    
    console.log('Player buzzer pressed:', state.currentPlayer.name);
    
    // Play buzzer sound immediately
    if (window.myBuzzer) {
      window.myBuzzer.play().catch(() => {
        playAudio('buzzer');
      });
    } else {
      playAudio('buzzer');
    }
    
    // Aggiungi il giocatore alla lista dei prenotati
    setCurrentRound(prev => {
      console.log('Adding player to answers:', state.currentPlayer!.name);
      return {
        ...prev,
        playerAnswers: [
          ...prev.playerAnswers,
          {
            playerId: state.currentPlayer!.id,
            playerName: state.currentPlayer!.name,
            timestamp: Date.now()
          }
        ]
      };
    });
    
    // Marca il giocatore come "ha risposto" per questa domanda
    setAnsweredPlayers(prev => new Set([...prev, state.currentPlayer!.id]));
    
    // Log the updated playerAnswers after state change
    setTimeout(() => {
      console.log('Updated player answers:', currentRound.playerAnswers);
    }, 100);
    
  }, [state.currentPlayer, isNarrator, hasPlayerAnswered, currentRound.playerAnswers]);
  
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
      
      // Se non ci sono più giocatori in coda, passa alla prossima domanda
      if (updatedPlayerAnswers.length === 0) {
        // Se siamo all'ultima domanda, resetta solo le risposte
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
      }
      
      // Se ci sono ancora giocatori in coda, mostra il prossimo
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
