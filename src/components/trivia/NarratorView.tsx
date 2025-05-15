
import React, { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from "@/components/ui/button";
import { Player } from '@/context/GameContext';
import { TriviaQuestion, PlayerAnswer } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import QuestionCard from './QuestionCard';
import QuestionInfo from './QuestionInfo';
import PlayerAnswerList from './PlayerAnswerList';
import PlayerRankings from './PlayerRankings';

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
      
      {/* Player Answer List Component */}
      <PlayerAnswerList
        playerAnswers={playerAnswers}
        onCorrectAnswer={onCorrectAnswer}
        onWrongAnswer={onWrongAnswer}
      />
      
      {/* Next Question Button */}
      <Button 
        onClick={onNextQuestion}
        className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
      >
        {language === 'it' ? 'Prossima Domanda' : 'Next Question'}
      </Button>
      
      {/* Player Rankings Component */}
      <PlayerRankings players={players} />
    </div>
  );
};

export default NarratorView;
