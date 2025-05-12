
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { playAudio } from '@/utils/audioUtils';
import { Player } from '@/context/GameContext';
import TriviaQuestion from './TriviaQuestion';
import { useToast } from '@/hooks/use-toast';

// Tipo per definire una domanda di trivia
interface TriviaQuestionType {
  id: string;
  textEn: string;
  textIt: string;
  answerEn: string;
  answerIt: string;
  options?: string[];
}

// Mock delle domande di trivia (in un'app reale sarebbero caricate da un database)
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
      
      // Notifica tutti i giocatori (in un'app reale, useremmo WebSockets)
      toast({
        title: language === 'it' ? "Rispondi alla domanda!" : "Answer the question!",
        description: language === 'it' 
          ? `${state.currentPlayer.name} sta rispondendo` 
          : `${state.currentPlayer.name} is answering`
      });
    }
  };
  
  // Funzione per valutare la risposta
  const handleJudgeAnswer = (correct: boolean) => {
    if (!isHost || !playerAnswering) return;
    
    if (correct) {
      playAudio('success');
      
      // Aggiorna il punteggio del giocatore
      dispatch({
        type: 'UPDATE_SCORE',
        payload: {
          playerId: playerAnswering.id,
          score: (playerAnswering.score || 0) + 1
        }
      });
      
      toast({
        title: language === 'it' ? "Risposta corretta!" : "Correct answer!",
        description: language === 'it' 
          ? `${playerAnswering.name} guadagna un punto` 
          : `${playerAnswering.name} earns a point`
      });
    } else {
      playAudio('error');
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
    } else {
      // Fine delle domande, potremmo mostrare un sommario
      toast({
        title: language === 'it' ? "Fine delle domande!" : "All questions completed!",
        description: language === 'it' 
          ? "Tutte le domande sono state completate" 
          : "All questions have been answered"
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
    
    // In un'app reale, notificheremmo gli altri giocatori tramite WebSocket
    toast({
      title: language === 'it' ? "Nuova domanda" : "New question",
      description: language === 'it' 
        ? "Il narratore ha mostrato una nuova domanda" 
        : "The narrator has revealed a new question"
    });
  };
  
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {waitingForNarrator ? (
        <Card className="p-6 w-full max-w-lg text-center">
          <p className="text-lg mb-4">
            {language === 'it' 
              ? "In attesa che il narratore mostri la domanda..." 
              : "Waiting for the narrator to show the question..."}
          </p>
        </Card>
      ) : (
        <div className="w-full max-w-lg">
          {isHost && !playerAnswering && (
            <div className="mb-4 flex justify-between items-center">
              <Button 
                variant="outline"
                onClick={handleShowQuestion}
              >
                {language === 'it' ? "Mostra Domanda" : "Show Question"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleRevealAnswer}
              >
                {language === 'it' ? "Rivela Risposta" : "Reveal Answer"}
              </Button>
            </div>
          )}
          
          <TriviaQuestion
            question={currentQuestion}
            showAnswer={showAnswer && isHost}
            language={language}
          />
          
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
                className="w-full py-8 text-lg"
                onClick={handlePlayerBuzz}
              >
                {language === 'it' ? "BUZZER" : "BUZZ IN"}
              </Button>
            </div>
          ) : null}
          
          {playerAnswering && !isHost && playerAnswering.id === state.currentPlayer?.id && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md text-center">
              <p className="text-yellow-800 font-bold">
                {language === 'it' 
                  ? "È il tuo turno di rispondere!" 
                  : "It's your turn to answer!"}
              </p>
            </div>
          )}
          
          {playerAnswering && !isHost && playerAnswering.id !== state.currentPlayer?.id && (
            <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-md text-center">
              <p className="text-gray-800">
                {language === 'it' 
                  ? `${playerAnswering.name} sta rispondendo...` 
                  : `${playerAnswering.name} is answering...`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TriviaGame;
