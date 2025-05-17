
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TriviaQuestion } from '@/types/trivia';
import { playAudio } from '@/utils/audioUtils';
import { BookOpenText, Trophy } from "lucide-react";

interface QuestionCardProps {
  currentQuestion: TriviaQuestion;
  questionKey?: string; // Added to reset state when question changes
}

const QuestionCard: React.FC<QuestionCardProps> = ({ currentQuestion, questionKey }) => {
  const { language } = useLanguage();
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // Reset to question view when the question changes
  useEffect(() => {
    setShowAnswer(false);
  }, [questionKey, currentQuestion.id]);

  const handleCardFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setShowAnswer(prev => !prev);
      setIsFlipping(false);
      if (!showAnswer) {
        playAudio('notification');
      }
    }, 600);
  };

  return (
    <div className="mb-6 h-[40vh] relative">
      {/* Perspective container for 3D effect */}
      <div 
        className={`w-full h-full perspective-1000 ${isFlipping ? 'animate-flip' : ''}`}
        style={{ perspective: '1000px' }}
        onClick={handleCardFlip}
      >
        {/* Card container with 3D space */}
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* Front Card (Question) - Positioned absolutely */}
          <Card 
            className={`absolute inset-0 w-full h-full transition-transform duration-500 ${
              showAnswer ? 'backface-hidden' : 'z-10'
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
              
              <div className="mt-6 text-sm text-gray-500">
                {language === 'it' ? 'Clicca per rivelare la risposta' : 'Click to reveal answer'}
              </div>
            </CardContent>
          </Card>
          
          {/* Back Card (Answer) - Also positioned absolutely */}
          <Card 
            className="absolute inset-0 w-full h-full bg-blue-50 transition-transform duration-500"
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
              
              <div className="mt-6 text-sm text-gray-500">
                {language === 'it' ? 'Clicca per vedere la domanda' : 'Click to see question'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
