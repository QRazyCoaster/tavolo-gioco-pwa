
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Player } from '@/context/GameContext';
import { TriviaQuestion, PlayerAnswer } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import { 
  BookOpenText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trophy
} from "lucide-react";

interface NarratorViewProps {
  currentQuestion: TriviaQuestion;
  roundNumber: number;
  questionNumber: number;
  totalQuestions: number;
  players: Player[];
  playerAnswers: PlayerAnswer[];
  onCorrectAnswer: (playerId: string) => void;
  onWrongAnswer: (playerId: string) => void;
  onNextQuestion: () => void;
  timeLeft: number;
}

const NarratorView: React.FC<NarratorViewProps> = ({
  currentQuestion,
  roundNumber,
  questionNumber,
  totalQuestions,
  players,
  playerAnswers,
  onCorrectAnswer,
  onWrongAnswer,
  onNextQuestion,
  timeLeft
}) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // Ordina i giocatori per punteggio (dal più alto al più basso)
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  const handleRevealAnswer = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setShowAnswer(true);
      setIsFlipping(false);
      playAudio('notification');
    }, 600);
  };
  
  const handleCorrectAnswer = (playerId: string) => {
    onCorrectAnswer(playerId);
    playAudio('success');
    toast({
      title: language === 'it' ? "Risposta esatta!" : "Correct answer!",
      description: language === 'it' ? "+10 punti" : "+10 points",
      variant: "default", // Changed from "success" to "default"
    });
  };
  
  const handleWrongAnswer = (playerId: string) => {
    onWrongAnswer(playerId);
    playAudio('error');
    toast({
      title: language === 'it' ? "Risposta sbagliata" : "Wrong answer",
      description: language === 'it' ? "-5 punti" : "-5 points",
      variant: "destructive",
    });
  };

  // Gestione del timer
  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0) {
      playAudio('tick');
    } else if (timeLeft === 0) {
      toast({
        title: language === 'it' ? "Tempo scaduto!" : "Time's up!",
        description: language === 'it' ? "Passaggio alla prossima domanda" : "Moving to next question",
        variant: "destructive",
      });
      onNextQuestion();
    }
  }, [timeLeft, language, toast, onNextQuestion]);

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto h-full">
      {/* Card Interattiva (40% dello schermo) */}
      <div className="mb-6 h-[40vh]">
        <div 
          className={`relative w-full h-full perspective-1000 ${isFlipping ? 'animate-flip' : ''}`}
          style={{ perspective: '1000px' }}
        >
          <Card 
            className={`w-full h-full absolute transition-all duration-500 ${
              showAnswer ? 'rotate-y-180 bg-blue-50' : ''
            }`}
            style={{ 
              transformStyle: 'preserve-3d',
              transform: showAnswer ? 'rotateY(180deg)' : '' 
            }}
          >
            {/* Lato Frontale (Domanda) */}
            <CardContent 
              className={`p-6 flex flex-col items-center justify-center w-full h-full ${
                showAnswer ? 'backface-hidden' : ''
              }`}
              style={{ backfaceVisibility: showAnswer ? 'hidden' : 'visible' }}
            >
              <BookOpenText size={40} className="text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-4 text-center">
                {language === 'it' ? 'Domanda:' : 'Question:'}
              </h2>
              <p className="text-xl text-center">
                {language === 'it' ? currentQuestion.textIt : currentQuestion.textEn}
              </p>
              
              {!showAnswer && (
                <Button 
                  className="mt-6" 
                  onClick={handleRevealAnswer}
                >
                  {language === 'it' ? 'Rivela Risposta' : 'Reveal Answer'}
                </Button>
              )}
            </CardContent>
            
            {/* Lato Posteriore (Risposta) */}
            <CardContent 
              className={`p-6 flex flex-col items-center justify-center w-full h-full rotate-y-180 ${
                !showAnswer ? 'backface-hidden' : ''
              }`}
              style={{ 
                backfaceVisibility: !showAnswer ? 'hidden' : 'visible',
                transform: 'rotateY(180deg)'
              }}
            >
              <Trophy size={40} className="text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold mb-4 text-center text-blue-800">
                {language === 'it' ? 'Risposta:' : 'Answer:'}
              </h2>
              <p className="text-xl font-semibold text-center text-blue-900">
                {language === 'it' ? currentQuestion.answerIt : currentQuestion.answerEn}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Timer e Contatore Domande */}
      <div className="flex justify-between items-center mb-4">
        <div className="bg-primary/10 px-4 py-2 rounded-md font-semibold">
          {language === 'it' 
            ? `Round ${roundNumber} • Domanda ${questionNumber}/${totalQuestions}`
            : `Round ${roundNumber} • Question ${questionNumber}/${totalQuestions}`}
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold ${
          timeLeft <= 10 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
        }`}>
          <Clock size={18} />
          <span>{timeLeft}s</span>
        </div>
      </div>
      
      {/* Lista Giocatori Prenotati */}
      {playerAnswers.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-lg">
            {language === 'it' ? 'Giocatori prenotati:' : 'Players waiting to answer:'}
          </h3>
          <div className="space-y-2">
            {playerAnswers.map((answer, index) => (
              <div key={answer.playerId} className="bg-white border p-3 rounded-lg flex justify-between items-center shadow-sm">
                <div className="flex items-center">
                  <span className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center font-semibold mr-3">
                    {index + 1}
                  </span>
                  <span className="font-medium">{answer.playerName}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleCorrectAnswer(answer.playerId)}
                  >
                    <CheckCircle size={16} />
                    <span>{language === 'it' ? 'Esatta' : 'Correct'}</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="flex items-center gap-1"
                    onClick={() => handleWrongAnswer(answer.playerId)}
                  >
                    <XCircle size={16} />
                    <span>{language === 'it' ? 'Errata' : 'Wrong'}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Pulsante Prossima Domanda */}
      <Button 
        onClick={onNextQuestion}
        className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
      >
        {language === 'it' ? 'Prossima Domanda' : 'Next Question'}
      </Button>
      
      {/* Classifica Giocatori Scrollabile */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-primary/10 px-4 py-2 font-semibold">
          {language === 'it' ? 'Classifica Giocatori' : 'Player Rankings'}
        </div>
        <ScrollArea className="h-56 w-full">
          <div className="p-4">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id} 
                className={`flex justify-between items-center py-2 border-b last:border-0 ${
                  player.isHost ? 'font-medium' : ''
                }`}
              >
                <div className="flex items-center">
                  <span className="text-gray-500 w-6">{index + 1}.</span>
                  <span>{player.name}</span>
                  {player.isHost && (
                    <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Host
                    </span>
                  )}
                </div>
                <span className="font-bold">{player.score || 0}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default NarratorView;
