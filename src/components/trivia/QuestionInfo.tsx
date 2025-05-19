
import React, { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Clock } from "lucide-react";

interface QuestionInfoProps {
  roundNumber: number;
  questionNumber: number;
  totalQuestions: number;
  timeLeft: number;
}

const QuestionInfo: React.FC<QuestionInfoProps> = ({
  roundNumber,
  questionNumber,
  totalQuestions,
  timeLeft
}) => {
  const { language } = useLanguage();

  // Ensure we have valid numbers for display
  const safeQuestionNumber = questionNumber || 1;
  const safeTotalQuestions = totalQuestions || 7; // Default to 7 if undefined
  
  // Log for debugging
  useEffect(() => {
    console.log(`[QuestionInfo] Rendering with question ${safeQuestionNumber}/${safeTotalQuestions}`);
  }, [safeQuestionNumber, safeTotalQuestions]);

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="bg-primary/10 px-4 py-2 rounded-md font-semibold">
        {language === 'it' 
          ? `Round ${roundNumber} • Domanda ${safeQuestionNumber}/${safeTotalQuestions}`
          : `Round ${roundNumber} • Question ${safeQuestionNumber}/${safeTotalQuestions}`}
      </div>
      
      <div className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold ${
        timeLeft <= 10 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
      }`}>
        <Clock size={18} />
        <span>{timeLeft}s</span>
      </div>
    </div>
  );
};

export default QuestionInfo;
