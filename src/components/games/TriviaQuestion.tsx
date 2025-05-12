
import React from 'react';
import { Card } from "@/components/ui/card";
import { Language } from '@/context/LanguageContext';

interface TriviaQuestionProps {
  question: {
    id: string;
    textEn: string;
    textIt: string;
    answerEn: string;
    answerIt: string;
    options?: string[];
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
          {language === 'it' ? question.textIt : question.textEn}
        </p>
      </div>
      
      {showAnswer && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-md font-semibold mb-1 text-blue-700">
            {language === 'it' ? "Risposta:" : "Answer:"}
          </h4>
          <p className="text-lg text-blue-800 font-semibold">
            {language === 'it' ? question.answerIt : question.answerEn}
          </p>
        </div>
      )}
    </Card>
  );
};

export default TriviaQuestion;
