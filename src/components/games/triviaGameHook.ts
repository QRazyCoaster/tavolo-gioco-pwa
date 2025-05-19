import { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { playAudio } from '@/utils/audioUtils';
import { Player } from '@/context/GameContext';

// Extracted question type
export interface TriviaQuestionType {
  id: string;
  textEn: string;
  textIt: string;
  answerEn: string;
  answerIt: string;
  options?: string[];
}

// Improved trivia questions with options
export const mockTriviaQuestions: TriviaQuestionType[] = [
  {
    id: '1',
    textEn: 'What is the capital of Italy?',
    textIt: 'Qual è la capitale dell\'Italia?',
    answerEn: 'Rome',
    answerIt: 'Roma',
    options: ['Milan', 'Rome', 'Venice', 'Florence']
  },
  {
    id: '2',
    textEn: 'Which planet is known as the Red Planet?',
    textIt: 'Quale pianeta è conosciuto come il Pianeta Rosso?',
    answerEn: 'Mars',
    answerIt: 'Marte',
    options: ['Jupiter', 'Mars', 'Venus', 'Saturn']
  },
  {
    id: '3',
    textEn: 'Who painted the Mona Lisa?',
    textIt: 'Chi ha dipinto la Monna Lisa?',
    answerEn: 'Leonardo da Vinci',
    answerIt: 'Leonardo da Vinci',
    options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello']
  },
  {
    id: '4',
    textEn: 'What is the largest ocean on Earth?',
    textIt: 'Qual è l\'oceano più grande della Terra?',
    answerEn: 'Pacific Ocean',
    answerIt: 'Oceano Pacifico',
    options: ['Atlantic Ocean', 'Indian Ocean', 'Pacific Ocean', 'Arctic Ocean']
  },
  {
    id: '5',
    textEn: 'Which country is known as the Land of the Rising Sun?',
    textIt: 'Quale paese è conosciuto come la Terra del Sol Levante?',
    answerEn: 'Japan',
    answerIt: 'Giappone',
    options: ['China', 'Japan', 'Thailand', 'South Korea']
  },
  {
    id: '6',
    textEn: 'Which element has the chemical symbol "O"?',
    textIt: 'Quale elemento ha il simbolo chimico "O"?',
    answerEn: 'Oxygen',
    answerIt: 'Ossigeno',
    options: ['Gold', 'Oxygen', 'Osmium', 'Oganesson']
  },
  {
    id: '7',
    textEn: 'What is the largest mammal in the world?',
    textIt: 'Qual è il mammifero più grande del mondo?',
    answerEn: 'Blue Whale',
    answerIt: 'Balenottera Azzurra',
    options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus']
  },
  {
    id: '8',
    textEn: 'In which year did the Titanic sink?',
    textIt: 'In quale anno affondò il Titanic?',
    answerEn: '1912',
    answerIt: '1912',
    options: ['1905', '1912', '1920', '1931']
  },
  {
    id: '9',
    textEn: 'Who wrote "Romeo and Juliet"?',
    textIt: 'Chi ha scritto "Romeo e Giulietta"?',
    answerEn: 'William Shakespeare',
    answerIt: 'William Shakespeare',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain']
  },
  {
    id: '10',
    textEn: 'What is the currency of Japan?',
    textIt: 'Qual è la valuta del Giappone?',
    answerEn: 'Yen',
    answerIt: 'Yen',
    options: ['Won', 'Yuan', 'Yen', 'Ringgit']
  }
];

export const useTriviaGameState = () => {
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const [questions] = useState<TriviaQuestionType[]>(mockTriviaQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [waitingForNarrator, setWaitingForNarrator] = useState<boolean>(false);
  const [queuedPlayers, setQueuedPlayers] = useState<Player[]>([]);
  
  // Check if current user is the narrator for this round
  // This is different from being the game host (creator)
  const isCurrentNarrator = state.currentPlayer?.isHost || false;
  const currentQuestion = questions[currentQuestionIndex];

  // Effect for showing the first question
  useEffect(() => {
    setWaitingForNarrator(!isCurrentNarrator);
  }, [isCurrentNarrator]);
  
  // Handle player buzzer
  const handlePlayerBuzz = () => {
    if (isCurrentNarrator || waitingForNarrator) {
      return;
    }
    
    // Play buzzer sound
    if (window.myBuzzer) {
      window.myBuzzer.play();
    } else {
      playAudio('notification');
    }
    
    // Add player to queue if not already present
    if (state.currentPlayer && !queuedPlayers.some(p => p.id === state.currentPlayer?.id)) {
      const newQueue = [...queuedPlayers, state.currentPlayer];
      setQueuedPlayers(newQueue);
      
      toast({
        title: language === 'it' ? "Giocatore in coda!" : "Player queued!",
        description: language === 'it' 
          ? `${state.currentPlayer.name} si è prenotato per rispondere` 
          : `${state.currentPlayer.name} is queued to answer`
      });
    }
  };
  
  // Assign point to a player
  const handleAssignPoint = (player: Player) => {
    if (!isCurrentNarrator) return;
    
    playAudio('success');
    
    const newScore = (player.score || 0) + 1;
    dispatch({
      type: 'UPDATE_SCORE',
      payload: {
        playerId: player.id,
        score: newScore
      }
    });
    
    toast({
      title: language === 'it' ? "Punto assegnato!" : "Point assigned!",
      description: language === 'it' 
        ? `${player.name} guadagna un punto (${newScore} totali)` 
        : `${player.name} earns a point (${newScore} total)`
    });
    
    setQueuedPlayers(prev => prev.filter(p => p.id !== player.id));
  };
  
  // Remove player from queue without points
  const handleRemovePlayerFromQueue = (playerId: string) => {
    if (!isCurrentNarrator) return;
    
    const player = state.players.find(p => p.id === playerId);
    if (player) {
      playAudio('error');
      
      toast({
        title: language === 'it' ? "Giocatore rimosso" : "Player removed",
        description: language === 'it' 
          ? `${player.name} rimosso dalla coda` 
          : `${player.name} removed from queue`
      });
    }
    
    setQueuedPlayers(prev => prev.filter(p => p.id !== playerId));
  };
  
  // Reveal answer to narrator
  const handleRevealAnswer = () => {
    if (!isCurrentNarrator) return;
    setShowAnswer(true);
    playAudio('notification');
  };
  
  // Show question to all players
  const handleShowQuestion = () => {
    if (!isCurrentNarrator) return;
    setWaitingForNarrator(false);
    playAudio('notification');
    
    setQueuedPlayers([]);
    
    toast({
      title: language === 'it' ? "Nuova domanda" : "New question",
      description: language === 'it' 
        ? "Il narratore ha mostrato una nuova domanda" 
        : "The narrator has revealed a new question"
    });
  };
  
  // Move to next question
  const handleNextQuestion = () => {
    if (!isCurrentNarrator) return;
    
    setShowAnswer(false);
    setQueuedPlayers([]);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentQuestionIndex(0);
      setRoundNumber(roundNumber + 1);
    }
    
    setWaitingForNarrator(true);
    
    toast({
      title: language === 'it' ? "Prossima domanda" : "Next question",
      description: language === 'it' 
        ? "Passiamo alla prossima domanda" 
        : "Moving to the next question"
    });

    setTimeout(() => {
      setWaitingForNarrator(false);
    }, 500);
  };
  
  // Get sorted players by score
  const sortedPlayers = [...state.players].sort((a, b) => 
    (b.score || 0) - (a.score || 0)
  );
  
  return {
    questions,
    currentQuestionIndex,
    showAnswer,
    roundNumber,
    waitingForNarrator,
    queuedPlayers,
    isCurrentNarrator, // Renamed from isHost to isCurrentNarrator for clarity
    currentQuestion,
    sortedPlayers,
    handlePlayerBuzz,
    handleAssignPoint,
    handleRemovePlayerFromQueue,
    handleRevealAnswer,
    handleShowQuestion,
    handleNextQuestion,
    setWaitingForNarrator
  };
};
