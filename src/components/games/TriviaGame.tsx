
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

/**
 * Main Trivia Game component
 * Shows different views based on player role:
 * - Current round's narrator: sees questions with answers and controls
 * - Other players: see questions without answers and can buzz in
 */
const TriviaGame = () => {
  const { language } = useLanguage();
  const { state } = useGame();
  
  const {
    waitingForNarrator,
    roundNumber,
    currentQuestionIndex,
    questions,
    showAnswer,
    isCurrentNarrator, // Renamed from isHost to isCurrentNarrator for clarity
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
          {/* Narrator controls - only visible to current narrator */}
          {isCurrentNarrator && (
            <NarratorControls 
              showAnswer={showAnswer}
              onShowQuestion={handleShowQuestion}
              onRevealAnswer={handleRevealAnswer}
              onNextQuestion={handleNextQuestion}
            />
          )}
          
          {/* Question display */}
          <TriviaQuestion
            question={currentQuestion}
            showAnswer={showAnswer && isCurrentNarrator}
            language={language}
          />

          {/* Player queue for narrator */}
          {isCurrentNarrator && (
            <PlayerQueue
              queuedPlayers={queuedPlayers}
              onAssignPoint={handleAssignPoint}
              onRemoveFromQueue={handleRemovePlayerFromQueue}
            />
          )}
          
          {/* Player buzzer - only visible to non-narrators */}
          {!isCurrentNarrator && !waitingForNarrator && (
            <PlayerBuzzer
              onPlayerBuzz={handlePlayerBuzz}
              queuedPlayers={queuedPlayers}
              currentPlayerId={state.currentPlayer?.id}
            />
          )}

          {/* Queue status for players */}
          {!isCurrentNarrator && (
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
