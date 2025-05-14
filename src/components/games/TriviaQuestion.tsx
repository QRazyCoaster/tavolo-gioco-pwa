
import React from 'react';
import { Card } from "@/components/ui/card";
import { Language } from '@/context/LanguageContext';
import { Trophy } from "lucide-react";

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
      
      {question.options && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <h4 className="font-medium text-sm mb-2 text-gray-600">
            {language === 'it' ? "Possibili risposte:" : "Possible answers:"}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {question.options.map((option, index) => (
              <div key={index} className="p-2 bg-white border border-gray-100 rounded text-sm">
                {option}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showAnswer && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-2">
          <Trophy size={20} className="text-blue-600" />
          <div>
            <h4 className="text-md font-semibold mb-1 text-blue-700">
              {language === 'it' ? "Risposta:" : "Answer:"}
            </h4>
            <p className="text-lg text-blue-800 font-semibold">
              {language === 'it' ? question.answerIt : question.answerEn}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

export default TriviaQuestion;
