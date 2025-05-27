
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import TriviaQuestion from './TriviaQuestion';
import { useTriviaGame } from '@/hooks/useTriviaGame';
import PlayerRankingList from './PlayerRankingList';

const TriviaGame = () => {
  const { language } = useLanguage();
  const { state } = useGame();
  
  const {
    currentRound,
    isNarrator,
    currentQuestion,
    questionNumber,
    totalQuestions,
    questionsLoaded,
    questionsError
  } = useTriviaGame();

  // Show loading state while questions are being loaded
  if (!questionsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-96">
        <div className="animate-pulse flex space-x-2 mb-4 justify-center">
          <div className="w-3 h-3 bg-blue-400 rounded-full" />
          <div className="w-3 h-3 bg-blue-400 rounded-full" />
          <div className="w-3 h-3 bg-blue-400 rounded-full" />
        </div>
        <p className="text-gray-600">
          {language === 'it' ? 'Caricamento domande...' : 'Loading questions...'}
        </p>
      </div>
    );
  }

  // Show error state if questions failed to load
  if (questionsError) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-96">
        <p className="text-red-600 mb-4">
          {language === 'it' ? 'Errore nel caricamento delle domande' : 'Error loading questions'}
        </p>
        <p className="text-sm text-gray-500">
          {questionsError}
        </p>
      </div>
    );
  }

  // Ensure we have a current question
  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-96">
        <p className="text-gray-600">
          {language === 'it' ? 'Nessuna domanda disponibile' : 'No questions available'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Header with question number and round */}
      <div className="w-full max-w-lg mb-4 flex justify-between items-center">
        <div className="text-primary font-semibold">
          {language === 'it' ? `Round ${currentRound.roundNumber}` : `Round ${currentRound.roundNumber}`}
        </div>
        <div className="text-primary font-semibold">
          {language === 'it' 
            ? `Domanda ${questionNumber}/${totalQuestions}` 
            : `Question ${questionNumber}/${totalQuestions}`}
        </div>
      </div>

      <div className="w-full max-w-lg">
        {/* Question display */}
        <TriviaQuestion
          question={currentQuestion}
          showAnswer={false}
          language={language}
        />

        {/* Player rankings for all */}
        <PlayerRankingList players={state.players.sort((a, b) => (b.score || 0) - (a.score || 0))} />
      </div>
    </div>
  );
};

export default TriviaGame;
