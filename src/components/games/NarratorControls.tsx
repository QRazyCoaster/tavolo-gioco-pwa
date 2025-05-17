
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from "@/components/ui/button";
import { Flag, Trophy } from "lucide-react";

interface NarratorControlsProps {
  showAnswer: boolean;
  onShowQuestion: () => void;
  onRevealAnswer: () => void;
  onNextQuestion: () => void;
}

const NarratorControls: React.FC<NarratorControlsProps> = ({
  showAnswer,
  onShowQuestion,
  onRevealAnswer,
  onNextQuestion
}) => {
  const { language } = useLanguage();
  
  return (
    <div className="mb-4 flex justify-between items-center">
      <Button 
        variant="outline"
        onClick={onShowQuestion}
        className="flex gap-2 items-center"
      >
        <Flag size={16} />
        {language === 'it' ? "Mostra Domanda" : "Show Question"}
      </Button>
      
      <Button 
        variant="outline"
        onClick={onRevealAnswer}
        className={`flex gap-2 items-center ${showAnswer ? "bg-blue-100" : ""}`}
      >
        <Trophy size={16} />
        {language === 'it' ? "Rivela Risposta" : "Reveal Answer"}
      </Button>
      
      <Button 
        variant="outline"
        onClick={onNextQuestion}
        className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
      >
        {language === 'it' ? "Prossima Domanda" : "Next Question"}
      </Button>
    </div>
  );
};

export default NarratorControls;
