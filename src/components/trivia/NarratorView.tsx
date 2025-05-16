
import React, { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from "@/components/ui/button";
import { Player } from '@/context/GameContext';
import { TriviaQuestion, PlayerAnswer } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import QuestionCard from './QuestionCard';
import QuestionInfo from './QuestionInfo';
import PlayerRankings from './PlayerRankings';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

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

  // Timer effects
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

  // Get the currently active player who needs to answer
  const currentPlayerAnswering = playerAnswers.length > 0 ? playerAnswers[0] : null;
  const playerInfo = currentPlayerAnswering 
    ? players.find(p => p.id === currentPlayerAnswering.playerId) 
    : null;

  // Debug logging for player answers
  useEffect(() => {
    console.log("Current player answers in NarratorView:", playerAnswers);
    console.log("Current player answering:", playerInfo?.name || "None");
  }, [playerAnswers, playerInfo]);

  // Handle correct answer
  const handleCorrectAnswer = () => {
    if (!currentPlayerAnswering) return;
    playAudio('success');
    onCorrectAnswer(currentPlayerAnswering.playerId);
    
    toast({
      title: language === 'it' ? "Risposta corretta!" : "Correct answer!",
      description: language === 'it' 
        ? `${playerInfo?.name} guadagna 10 punti` 
        : `${playerInfo?.name} earns 10 points`,
    });
  };

  // Handle wrong answer
  const handleWrongAnswer = () => {
    if (!currentPlayerAnswering) return;
    playAudio('error');
    onWrongAnswer(currentPlayerAnswering.playerId);
    
    toast({
      title: language === 'it' ? "Risposta errata!" : "Wrong answer!",
      description: language === 'it' 
        ? `${playerInfo?.name} perde 5 punti` 
        : `${playerInfo?.name} loses 5 points`,
    });
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto h-full">
      {/* Question Card Component */}
      <QuestionCard currentQuestion={currentQuestion} />
      
      {/* Question Info Component */}
      <QuestionInfo 
        roundNumber={roundNumber}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        timeLeft={timeLeft}
      />
      
      {/* Current Player Answering */}
      {currentPlayerAnswering && playerInfo ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg animate-fade-in">
          <div className="text-center mb-3">
            <h3 className="font-bold text-xl text-blue-800">
              {language === 'it' ? "Primo a rispondere:" : "First to answer:"}
            </h3>
            <p className="text-2xl font-semibold text-blue-900">{playerInfo.name}</p>
          </div>
          
          <div className="flex justify-center gap-6 mt-4">
            <Button
              onClick={handleCorrectAnswer}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2 px-6 py-4"
            >
              <ThumbsUp className="h-6 w-6" />
              <span className="font-medium">
                {language === 'it' ? "+10 punti" : "+10 points"}
              </span>
            </Button>
            
            <Button
              onClick={handleWrongAnswer}
              size="lg" 
              className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 px-6 py-4"
            >
              <ThumbsDown className="h-6 w-6" />
              <span className="font-medium">
                {language === 'it' ? "-5 punti" : "-5 points"}
              </span>
            </Button>
          </div>
          
          <div className="text-center mt-4 text-sm text-gray-600">
            {language === 'it' 
              ? "Premi pollice su per risposta corretta, giù per risposta errata" 
              : "Press thumbs up for correct answer, down for wrong answer"}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-gray-600">
            {language === 'it' 
              ? "In attesa che qualcuno risponda..." 
              : "Waiting for someone to answer..."}
          </p>
        </div>
      )}
      
      {/* Player Queue */}
      {playerAnswers.length > 1 && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold mb-2">
            {language === 'it' ? "Prossimi giocatori in coda:" : "Next players in queue:"}
          </h3>
          <ol className="list-decimal pl-5 space-y-1">
            {playerAnswers.slice(1).map((answer, index) => {
              const player = players.find(p => p.id === answer.playerId);
              return (
                <li key={answer.playerId} className="text-gray-700">
                  {player?.name || `Player ${index + 2}`}
                </li>
              );
            })}
          </ol>
        </div>
      )}
      
      {/* Next Question Button - only show when no players are left to answer */}
      {playerAnswers.length === 0 && (
        <Button 
          onClick={onNextQuestion}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
        >
          {language === 'it' ? 'Prossima Domanda' : 'Next Question'}
        </Button>
      )}
      
      {/* Player Rankings Component */}
      <PlayerRankings players={players} />
    </div>
  );
};

export default NarratorView;
