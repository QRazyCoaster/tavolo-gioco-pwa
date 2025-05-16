
import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TriviaQuestion } from '@/types/trivia';
import { playAudio } from '@/utils/audioUtils';
import { BookOpenText, Trophy } from "lucide-react";

interface QuestionCardProps {
  currentQuestion: TriviaQuestion;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ currentQuestion }) => {
  const { language } = useLanguage();
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  const handleRevealAnswer = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setShowAnswer(true);
      setIsFlipping(false);
      playAudio('notification');
    }, 600);
  };

  return (
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
          {/* Front Side (Question) */}
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
          
          {/* Back Side (Answer) - Now part of the card */}
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
  );
};

export default QuestionCard;
