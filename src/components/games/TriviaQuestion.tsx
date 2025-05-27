
import React from 'react';
import { Card } from "@/components/ui/card";
import { Language } from '@/context/LanguageContext';
import { Trophy } from "lucide-react";

interface TriviaQuestionProps {
  question: {
    id: string;
    question: string;
    correct_answer: string;
    category?: string;
  };
  showAnswer: boolean;
  language: Language;
}

const TriviaQuestion: React.FC<TriviaQuestionProps> = ({
  question,
  showAnswer,
  language
}) => {
  return (
    <Card className="p-6 w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">
          {language === 'it' ? "Domanda:" : "Question:"}
        </h3>
        <p className="text-xl">
          {question.question}
        </p>
      </div>
      
      {showAnswer && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
          <Trophy size={20} className="text-blue-600" />
          <div>
            <h4 className="text-md font-semibold mb-1 text-blue-700">
              {language === 'it' ? "Risposta:" : "Answer:"}
            </h4>
            <p className="text-lg text-blue-800 font-semibold">
              {question.correct_answer}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TriviaQuestion;
