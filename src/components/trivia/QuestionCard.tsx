
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
        {/* Card container with 3D space - position:relative so it maintains its space in document flow */}
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Front Card (Question) */}
          <Card 
            className={`w-full h-full absolute transition-all duration-500 ${
              showAnswer ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: showAnswer ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center w-full h-full">
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
          </Card>
          
          {/* Back Card (Answer) - Starts flipped, then rotates into view */}
          <Card 
            className={`w-full h-full absolute bg-blue-50 transition-all duration-500 ${
              !showAnswer ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: showAnswer ? 'rotateY(0deg)' : 'rotateY(-180deg)'
            }}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center w-full h-full">
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
    </div>
  );
};

export default QuestionCard;
