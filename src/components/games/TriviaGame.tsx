import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { playAudio } from '@/utils/audioUtils';
import { Player } from '@/context/GameContext';
import TriviaQuestion from './TriviaQuestion';
import { useToast } from '@/hooks/use-toast';
import { Award, Flag, GamepadIcon, PlusIcon, Trophy } from "lucide-react";

// Tipo per definire una domanda di trivia
interface TriviaQuestionType {
  id: string;
  textEn: string;
  textIt: string;
  answerEn: string;
  answerIt: string;
  options?: string[];
}

// Domande trivia migliorate (più domande e opzioni complete per tutte)
const mockTriviaQuestions: TriviaQuestionType[] = [
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

const TriviaGame = () => {
  const { t, language } = useLanguage();
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  
  const [questions] = useState<TriviaQuestionType[]>(mockTriviaQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [waitingForNarrator, setWaitingForNarrator] = useState<boolean>(false);

  // Nuova gestione dei giocatori prenotati per rispondere
  const [queuedPlayers, setQueuedPlayers] = useState<Player[]>([]);
  
  const isHost = state.currentPlayer?.isHost || false;
  const currentQuestion = questions[currentQuestionIndex];
  
  // Effetto per mostrare la prima domanda
  useEffect(() => {
    if (isHost) {
      // Solo l'host vede il pulsante per mostrare la domanda
      setWaitingForNarrator(false);
    } else {
      // Gli altri giocatori vedono un messaggio di attesa
      setWaitingForNarrator(true);
    }
  }, [isHost]);
  
  // Funzione per gestire il buzzer di un giocatore
  const handlePlayerBuzz = () => {
    if (isHost || waitingForNarrator) {
      // L'host non può rispondere alle domande, solo fare il narratore
      return;
    }
    
    // Riproduce il suono del buzzer del giocatore se definito
    if (window.myBuzzer) {
      window.myBuzzer.play();
    } else {
      playAudio('notification');
    }
    
    // Aggiunge questo giocatore alla coda se non è già presente
    if (state.currentPlayer && !queuedPlayers.some(p => p.id === state.currentPlayer?.id)) {
      const newQueue = [...queuedPlayers, state.currentPlayer];
      setQueuedPlayers(newQueue);
      
      // Notifica tutti i giocatori
      toast({
        title: language === 'it' ? "Giocatore in coda!" : "Player queued!",
        description: language === 'it' 
          ? `${state.currentPlayer.name} si è prenotato per rispondere` 
          : `${state.currentPlayer.name} is queued to answer`
      });
    }
  };
  
  // Funzione per il narratore che assegna un punto
  const handleAssignPoint = (player: Player) => {
    if (!isHost) return;
    
    playAudio('success');
    
    // Aggiorna il punteggio del giocatore
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
    
    // Rimuove il giocatore dalla coda
    setQueuedPlayers(prev => prev.filter(p => p.id !== player.id));
  };
  
  // Funzione per rimuovere un giocatore dalla coda senza assegnare punti
  const handleRemovePlayerFromQueue = (playerId: string) => {
    if (!isHost) return;
    
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
  
  // Funzione per mostrare la risposta al narratore
  const handleRevealAnswer = () => {
    if (!isHost) return;
    setShowAnswer(true);
    playAudio('notification');
  };
  
  // Funzione per il narratore che mostra la domanda
  const handleShowQuestion = () => {
    if (!isHost) return;
    setWaitingForNarrator(false);
    playAudio('notification');
    
    // Resetta la coda dei giocatori per la nuova domanda
    setQueuedPlayers([]);
    
    // Notifica gli altri giocatori
    toast({
      title: language === 'it' ? "Nuova domanda" : "New question",
      description: language === 'it' 
        ? "Il narratore ha mostrato una nuova domanda" 
        : "The narrator has revealed a new question"
    });
  };
  
  // Funzione per passare alla domanda successiva
  const handleNextQuestion = () => {
    if (!isHost) return;
    
    setShowAnswer(false);
    setQueuedPlayers([]);
    
    // Passa alla domanda successiva
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Ricomincia dall'inizio con un nuovo round
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

    // Mostra subito la domanda dopo aver cliccato "Prossima"
    setTimeout(() => {
      setWaitingForNarrator(false);
    }, 500);
  };
  
  // Classifica dei giocatori (ordinata per punteggio)
  const sortedPlayers = [...state.players].sort((a, b) => 
    (b.score || 0) - (a.score || 0)
  );
  
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Intestazione con il numero della domanda e round */}
      <div className="w-full max-w-lg mb-4 flex justify-between items-center">
        <div className="text-primary font-semibold">
          {language === 'it' ? `Round ${roundNumber}` : `Round ${roundNumber}`}
        </div>
        <div className="text-primary font-semibold">
          {language === 'it' 
            ? `Domanda ${currentQuestionIndex + 1}/${questions.length}` 
            : `Question ${currentQuestionIndex + 1}/${questions.length}`}
        </div>
      </div>

      {waitingForNarrator ? (
        <Card className="p-6 w-full max-w-lg text-center">
          <p className="text-lg mb-4">
            {language === 'it' 
              ? "In attesa che il narratore mostri la domanda..." 
              : "Waiting for the narrator to show the question..."}
          </p>
          
          {/* Mostra la classifica durante l'attesa */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">
              {language === 'it' ? "Classifica attuale:" : "Current ranking:"}
            </h3>
            <div className="space-y-2">
              {sortedPlayers.slice(0, 3).map((player, index) => (
                <div key={player.id} className="flex items-center justify-between bg-primary/5 p-2 rounded-md">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Trophy size={16} className="text-yellow-500" />}
                    {index === 1 && <Award size={16} className="text-gray-400" />}
                    {index === 2 && <Award size={16} className="text-amber-700" />}
                    <span>{player.name}</span>
                  </div>
                  <span className="font-semibold">{player.score || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <div className="w-full max-w-lg">
          {isHost && (
            <div className="mb-4 flex justify-between items-center">
              <Button 
                variant="outline"
                onClick={handleShowQuestion}
                className="flex gap-2 items-center"
              >
                <Flag size={16} />
                {language === 'it' ? "Mostra Domanda" : "Show Question"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleRevealAnswer}
                className={`flex gap-2 items-center ${showAnswer ? "bg-blue-100" : ""}`}
              >
                <Trophy size={16} />
                {language === 'it' ? "Rivela Risposta" : "Reveal Answer"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleNextQuestion}
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              >
                {language === 'it' ? "Prossima Domanda" : "Next Question"}
              </Button>
            </div>
          )}
          
          <TriviaQuestion
            question={currentQuestion}
            showAnswer={showAnswer && isHost}
            language={language}
          />

          {/* Visualizzazione della coda dei giocatori per il narratore */}
          {isHost && queuedPlayers.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold mb-3 text-blue-800">
                {language === 'it' ? "Giocatori prenotati:" : "Queued players:"}
              </h3>
              <div className="space-y-2">
                {queuedPlayers.map((player, index) => (
                  <div key={player.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
                        onClick={() => handleAssignPoint(player)}
                      >
                        <PlusIcon size={16} />
                        <span>1</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => handleRemovePlayerFromQueue(player.id)}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Pulsante Buzzer per i giocatori */}
          {!isHost && !waitingForNarrator && (
            <div className="mt-4">
              <Button 
                variant="default"
                className={`w-full py-8 text-lg flex items-center justify-center gap-2 ${
                  queuedPlayers.some(p => p.id === state.currentPlayer?.id)
                    ? "bg-gray-400 hover:bg-gray-400 cursor-not-allowed"
                    : ""
                }`}
                onClick={handlePlayerBuzz}
                disabled={queuedPlayers.some(p => p.id === state.currentPlayer?.id)}
              >
                <GamepadIcon size={24} />
                {queuedPlayers.some(p => p.id === state.currentPlayer?.id)
                  ? (language === 'it' ? "IN ATTESA" : "WAITING") 
                  : (language === 'it' ? "BUZZER" : "BUZZ IN")}
              </Button>
            </div>
          )}

          {/* Visualizzazione dello stato della coda per i giocatori */}
          {!isHost && queuedPlayers.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="font-semibold mb-2">
                {language === 'it' ? "Giocatori in coda:" : "Players in queue:"}
              </h3>
              <ol className="list-decimal pl-5 space-y-1">
                {queuedPlayers.map((player) => (
                  <li key={player.id} className={`
                    ${player.id === state.currentPlayer?.id ? "font-bold text-blue-700" : ""}
                  `}>
                    {player.name} {player.id === state.currentPlayer?.id ? 
                      (language === 'it' ? "(tu)" : "(you)") : ""}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Classifica in tempo reale */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="font-semibold mb-2">
              {language === 'it' ? "Classifica:" : "Ranking:"}
            </h3>
            <div className="space-y-2">
              {sortedPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-5">{index + 1}.</span>
                    <span>{player.name}</span>
                  </div>
                  <span className="font-semibold">{player.score || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TriviaGame;
