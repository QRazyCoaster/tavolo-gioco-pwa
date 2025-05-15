
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from "@/components/ui/button";
import { PlayerAnswer } from '@/types/trivia';
import { CheckCircle, XCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';

interface PlayerAnswerListProps {
  playerAnswers: PlayerAnswer[];
  onCorrectAnswer: (playerId: string) => void;
  onWrongAnswer: (playerId: string) => void;
}

const PlayerAnswerList: React.FC<PlayerAnswerListProps> = ({
  playerAnswers,
  onCorrectAnswer,
  onWrongAnswer
}) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const handleCorrectAnswer = (playerId: string) => {
    onCorrectAnswer(playerId);
    playAudio('success');
    toast({
      title: language === 'it' ? "Risposta esatta!" : "Correct answer!",
      description: language === 'it' ? "+10 punti" : "+10 points",
      variant: "default", 
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

  if (playerAnswers.length === 0) return null;

  return (
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
  );
};

export default PlayerAnswerList;
