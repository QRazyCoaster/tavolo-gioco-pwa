// src/components/trivia/NarratorView.tsx

import React, { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
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
  onCorrectAnswer?: (playerId: string) => void;
  onWrongAnswer?: (playerId: string) => void;
  onNextQuestion: () => void;
  timeLeft: number;
  showPendingAnswers: boolean;
  setShowPendingAnswers: (show: boolean) => void;
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
  timeLeft,
  showPendingAnswers,
  setShowPendingAnswers
}) => {
  const { language } = useLanguage();
  const { toast } = useToast();

  // 1) Timer: auto-advance on timeout, tick at 10s
  useEffect(() => {
    if (timeLeft === 0) {
      toast({
        title: language === 'it' ? 'Tempo scaduto!' : "Time's up!",
        description: language === 'it'
          ? 'Passaggio alla prossima domanda'
          : 'Moving to next question',
        variant: 'destructive'
      });
      onNextQuestion();
    } else if (timeLeft === 10) {
      playAudio('tick');
    }
  }, [timeLeft, language, toast, onNextQuestion]);

  // 2) Show answer panel when someone buzzes
  useEffect(() => {
    if (playerAnswers.length > 0 && !showPendingAnswers) {
      setShowPendingAnswers(true);
    }
  }, [playerAnswers, showPendingAnswers, setShowPendingAnswers]);

  const currentPlayerAnswering = playerAnswers[0];
  const playerInfo = players.find(p => p.id === currentPlayerAnswering?.playerId);

  // 3) Handlers with 200ms delay before advancing
  const handleCorrectClick = () => {
    if (onCorrectAnswer) onCorrectAnswer(currentPlayerAnswering!.playerId);
    setTimeout(() => {
      onNextQuestion();
    }, 200);
  };

  const handleWrongClick = () => {
    if (onWrongAnswer) onWrongAnswer(currentPlayerAnswering!.playerId);
    setTimeout(() => {
      onNextQuestion();
    }, 200);
  };

  // 4) Render
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto h-full">
      {/* Always show question & meta */}
      <QuestionCard 
        currentQuestion={currentQuestion}
        questionKey={currentQuestion.id}
      />
      <QuestionInfo
        roundNumber={roundNumber}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        timeLeft={timeLeft}
      />

      {/* If someone queued, show answer buttons; else, show rankings */}
      {showPendingAnswers && currentPlayerAnswering && playerInfo ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg animate-fade-in">
          <div className="text-center mb-3">
            <h3 className="font-bold text-xl text-blue-800">
              {language === 'it' ? 'Primo a rispondere:' : 'First to answer:'}
            </h3>
            <p className="text-2xl font-semibold text-blue-900">
              {playerInfo.name}
            </p>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <Button
              onClick={handleCorrectClick}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2 px-6 py-4"
            >
              <ThumbsUp className="h-6 w-6" />
              <span>{language === 'it' ? '+10 punti' : '+10 points'}</span>
            </Button>
            <Button
              onClick={handleWrongClick}
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 px-6 py-4"
            >
              <ThumbsDown className="h-6 w-6" />
              <span>{language === 'it' ? '-5 punti' : '-5 points'}</span>
            </Button>
          </div>

          {playerAnswers.length > 1 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-center">
                {language === 'it' ? 'Prossimi in coda:' : 'Next players in queue:'}
              </h4>
              <ol className="list-decimal pl-5 space-y-1 text-center">
                {playerAnswers.slice(1).map(ans => {
                  const p = players.find(q => q.id === ans.playerId);
                  return <li key={ans.playerId}>{p?.name || 'Player'}</li>;
                })}
              </ol>
            </div>
          )}
        </div>
      ) : (
        <PlayerRankings players={players} />
      )}

      {/* Manual Next Question when no queue */}
      {playerAnswers.length === 0 && (
        <Button 
          onClick={onNextQuestion} 
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700"
        >
          {language === 'it' ? 'Prossima Domanda' : 'Next Question'}
        </Button>
      )}
    </div>
  );
};

export default NarratorView;
