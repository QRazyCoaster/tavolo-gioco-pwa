
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { playAudio } from '@/utils/audioUtils';
import { Player } from '@/context/GameContext';
import TriviaQuestion from './TriviaQuestion';
import { useToast } from '@/hooks/use-toast';
import { Award, Flag, GamepadIcon, Trophy } from "lucide-react";

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
  const [playerAnswering, setPlayerAnswering] = useState<Player | null>(null);
  const [waitingForNarrator, setWaitingForNarrator] = useState<boolean>(false);
  const [scoreHistory, setScoreHistory] = useState<{playerId: string, correct: boolean}[]>([]);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  
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
  
  // Timer per rispondere
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    
    if (timerActive && timeLeft !== null && timeLeft > 0) {
      timerId = setTimeout(() => {
        setTimeLeft(prev => prev !== null ? prev - 1 : null);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      // Tempo scaduto
      setTimerActive(false);
      
      if (playerAnswering) {
        playAudio('error');
        toast({
          title: language === 'it' ? "Tempo scaduto!" : "Time's up!",
          description: language === 'it' 
            ? `${playerAnswering.name} non ha risposto in tempo` 
            : `${playerAnswering.name} didn't answer in time`,
          variant: "destructive"
        });
        setPlayerAnswering(null);
      }
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [timerActive, timeLeft, playerAnswering, toast, language]);
  
  // Funzione per gestire il buzzer di un giocatore
  const handlePlayerBuzz = () => {
    if (isHost || playerAnswering || waitingForNarrator) {
      // L'host non può rispondere alle domande, solo fare il narratore
      return;
    }
    
    // Riproduce il suono del buzzer del giocatore se definito
    if (window.myBuzzer) {
      window.myBuzzer.play();
    } else {
      playAudio('notification');
    }
    
    // Imposta questo giocatore come quello che sta rispondendo
    if (state.currentPlayer) {
      setPlayerAnswering(state.currentPlayer);
      setTimeLeft(15); // 15 secondi per rispondere
      setTimerActive(true);
      
      // Notifica tutti i giocatori
      toast({
        title: language === 'it' ? "Rispondi alla domanda!" : "Answer the question!",
        description: language === 'it' 
          ? `${state.currentPlayer.name} sta rispondendo (15 secondi)` 
          : `${state.currentPlayer.name} is answering (15 seconds)`
      });
    }
  };
  
  // Funzione per valutare la risposta
  const handleJudgeAnswer = (correct: boolean) => {
    if (!isHost || !playerAnswering) return;
    
    // Ferma il timer
    setTimerActive(false);
    setTimeLeft(null);
    
    if (correct) {
      playAudio('success');
      
      // Aggiorna il punteggio del giocatore
      const newScore = (playerAnswering.score || 0) + 1;
      dispatch({
        type: 'UPDATE_SCORE',
        payload: {
          playerId: playerAnswering.id,
          score: newScore
        }
      });
      
      // Aggiorna la cronologia dei punteggi
      setScoreHistory(prev => [...prev, { playerId: playerAnswering.id, correct: true }]);
      
      toast({
        title: language === 'it' ? "Risposta corretta!" : "Correct answer!",
        description: language === 'it' 
          ? `${playerAnswering.name} guadagna un punto (${newScore} totali)` 
          : `${playerAnswering.name} earns a point (${newScore} total)`
      });
    } else {
      playAudio('error');
      
      // Aggiorna la cronologia dei punteggi
      setScoreHistory(prev => [...prev, { playerId: playerAnswering.id, correct: false }]);
      
      toast({
        title: language === 'it' ? "Risposta sbagliata" : "Wrong answer",
        description: language === 'it' 
          ? `Nessun punto per ${playerAnswering.name}` 
          : `No points for ${playerAnswering.name}`
      });
    }
    
    // Resetta lo stato per la prossima domanda
    setPlayerAnswering(null);
    setShowAnswer(false);
    
    // Passa alla domanda successiva
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setWaitingForNarrator(true);
    } else {
      // Ricomincia dall'inizio con un nuovo round
      setCurrentQuestionIndex(0);
      setWaitingForNarrator(true);
      setRoundNumber(roundNumber + 1);
      
      // Fine delle domande del round
      toast({
        title: language === 'it' ? `Round ${roundNumber} completato!` : `Round ${roundNumber} completed!`,
        description: language === 'it' 
          ? "Un nuovo round sta per iniziare" 
          : "A new round is about to begin"
      });
    }
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
    
    // Notifica gli altri giocatori
    toast({
      title: language === 'it' ? "Nuova domanda" : "New question",
      description: language === 'it' 
        ? "Il narratore ha mostrato una nuova domanda" 
        : "The narrator has revealed a new question"
    });
  };
  
  // Funzione per saltare la domanda corrente
  const handleSkipQuestion = () => {
    if (!isHost) return;
    
    setPlayerAnswering(null);
    setShowAnswer(false);
    setTimerActive(false);
    setTimeLeft(null);
    
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
      title: language === 'it' ? "Domanda saltata" : "Question skipped",
      description: language === 'it' 
        ? "Passiamo alla prossima domanda" 
        : "Moving to the next question"
    });
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
          {isHost && !playerAnswering && (
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
                onClick={handleSkipQuestion}
                className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
              >
                {language === 'it' ? "Salta Domanda" : "Skip Question"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleRevealAnswer}
                className="flex gap-2 items-center"
              >
                <Trophy size={16} />
                {language === 'it' ? "Rivela Risposta" : "Reveal Answer"}
              </Button>
            </div>
          )}
          
          <TriviaQuestion
            question={currentQuestion}
            showAnswer={showAnswer && isHost}
            language={language}
          />
          
          {/* Timer per rispondere */}
          {timerActive && timeLeft !== null && (
            <div className="mt-4 w-full">
              <div className="bg-gray-200 h-4 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear ${
                    timeLeft > 10 ? "bg-green-500" : timeLeft > 5 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${(timeLeft / 15) * 100}%` }}
                ></div>
              </div>
              <div className="text-center mt-1 text-sm font-semibold">
                {timeLeft} {language === 'it' ? "secondi" : "seconds"}
              </div>
            </div>
          )}
          
          {isHost && playerAnswering ? (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Button 
                variant="default"
                className="bg-green-500 hover:bg-green-600"
                onClick={() => handleJudgeAnswer(true)}
              >
                {language === 'it' ? "Risposta Corretta" : "Correct Answer"}
              </Button>
              <Button
                variant="default"
                className="bg-red-500 hover:bg-red-600"
                onClick={() => handleJudgeAnswer(false)}
              >
                {language === 'it' ? "Risposta Sbagliata" : "Wrong Answer"}
              </Button>
            </div>
          ) : !isHost && !playerAnswering && !waitingForNarrator ? (
            <div className="mt-4">
              <Button 
                variant="default"
                className="w-full py-8 text-lg flex items-center justify-center gap-2"
                onClick={handlePlayerBuzz}
              >
                <GamepadIcon size={24} />
                {language === 'it' ? "BUZZER" : "BUZZ IN"}
              </Button>
            </div>
          ) : null}
          
          {playerAnswering && !isHost && playerAnswering.id === state.currentPlayer?.id && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md text-center">
              <p className="text-yellow-800 font-bold">
                {language === 'it' 
                  ? `È il tuo turno di rispondere! (${timeLeft || 0} secondi)` 
                  : `It's your turn to answer! (${timeLeft || 0} seconds)`}
              </p>
            </div>
          )}
          
          {playerAnswering && !isHost && playerAnswering.id !== state.currentPlayer?.id && (
            <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-md text-center">
              <p className="text-gray-800">
                {language === 'it' 
                  ? `${playerAnswering.name} sta rispondendo... (${timeLeft || 0} secondi)` 
                  : `${playerAnswering.name} is answering... (${timeLeft || 0} seconds)`}
              </p>
            </div>
          )}

          {/* Mostra gli ultimi risultati se ci sono */}
          {!waitingForNarrator && scoreHistory.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="font-semibold mb-2">
                {language === 'it' ? "Ultime risposte:" : "Recent answers:"}
              </h3>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {[...scoreHistory].reverse().slice(0, 5).map((record, idx) => {
                  const player = state.players.find(p => p.id === record.playerId);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${record.correct ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span>{player?.name || "Unknown"}: </span>
                      <span className={record.correct ? 'text-green-600' : 'text-red-600'}>
                        {record.correct 
                          ? (language === 'it' ? "Corretta" : "Correct") 
                          : (language === 'it' ? "Errata" : "Wrong")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TriviaGame;
