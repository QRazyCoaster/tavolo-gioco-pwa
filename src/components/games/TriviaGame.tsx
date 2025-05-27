
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import TriviaQuestion from './TriviaQuestion';
import { useTriviaGameState } from './triviaGameHook';
import WaitingForNarrator from './WaitingForNarrator';
import NarratorControls from './NarratorControls';
import PlayerQueue from './PlayerQueue';
import PlayerBuzzer from './PlayerBuzzer';
import QueueStatus from './QueueStatus';
import PlayerRankingList from './PlayerRankingList';

const TriviaGame = () => {
  const { language } = useLanguage();
  const { state } = useGame();
  
  const {
    waitingForNarrator,
    roundNumber,
    currentQuestionIndex,
    questions,
    showAnswer,
    isHost,
    currentQuestion,
    queuedPlayers,
    sortedPlayers,
    handlePlayerBuzz,
    handleAssignPoint,
    handleRemovePlayerFromQueue,
    handleRevealAnswer,
    handleShowQuestion,
    handleNextQuestion
  } = useTriviaGameState();

  // Convert the old question format to the new format for compatibility
  const convertedQuestion = currentQuestion ? {
    id: currentQuestion.id,
    question: language === 'it' ? currentQuestion.textIt : currentQuestion.textEn,
    correct_answer: language === 'it' ? currentQuestion.answerIt : currentQuestion.answerEn,
    category: 'general' // Default category since the old hook doesn't provide it
  } : {
    id: '',
    question: '',
    correct_answer: '',
    category: 'general'
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Header with question number and round */}
      <div className="w-full max-w-lg mb-4 flex justify-between items-center">
        <div className="text-primary font-semibold">
          {language === 'it' ? `Round ${roundNumber}` : `Round ${roundNumber}`}
        </div>
        <div className="text-primary font-semibold">
          {language === 'it' 
            ? `Domanda ${currentQuestionIndex + 1}/${questions.length}` 
            : `Question ${currentQuestionIndex + 1}/${questions.length}`}
        </div>
      </div>

      {waitingForNarrator ? (
        <WaitingForNarrator sortedPlayers={sortedPlayers} />
      ) : (
        <div className="w-full max-w-lg">
          {/* Narrator controls */}
          {isHost && (
            <NarratorControls 
              showAnswer={showAnswer}
              onShowQuestion={handleShowQuestion}
              onRevealAnswer={handleRevealAnswer}
              onNextQuestion={handleNextQuestion}
            />
          )}
          
          {/* Question display */}
          <TriviaQuestion
            question={convertedQuestion}
            showAnswer={showAnswer && isHost}
            language={language}
          />

          {/* Player queue for narrator */}
          {isHost && (
            <PlayerQueue
              queuedPlayers={queuedPlayers}
              onAssignPoint={handleAssignPoint}
              onRemoveFromQueue={handleRemovePlayerFromQueue}
            />
          )}
          
          {/* Player buzzer */}
          {!isHost && !waitingForNarrator && (
            <PlayerBuzzer
              onPlayerBuzz={handlePlayerBuzz}
              queuedPlayers={queuedPlayers}
              currentPlayerId={state.currentPlayer?.id}
            />
          )}

          {/* Queue status for players */}
          {!isHost && (
            <QueueStatus 
              queuedPlayers={queuedPlayers}
              currentPlayerId={state.currentPlayer?.id}
            />
          )}

          {/* Player rankings for all */}
          <PlayerRankingList players={sortedPlayers} />
        </div>
      )}
    </div>
  );
};

export default TriviaGame;
