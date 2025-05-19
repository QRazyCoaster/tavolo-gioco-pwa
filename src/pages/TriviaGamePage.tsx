
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { useTriviaGame } from '@/hooks/useTriviaGame';
import { useToast } from '@/hooks/use-toast';
import NarratorView from '@/components/trivia/NarratorView';
import PlayerView from '@/components/trivia/PlayerView';
import RoundBridgePage from '@/components/trivia/RoundBridgePage';
import GameEndScreen from '@/components/trivia/GameEndScreen';
import LoadingSpinner from '@/components/trivia/LoadingSpinner';
import GameHeader from '@/components/trivia/GameHeader';
import BackgroundMusicController from '@/components/trivia/BackgroundMusicController';

const TriviaGamePage = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  /* ─────────── Game-round hook ─────────── */
  const {
    currentRound,
    isCurrentNarrator,
    hasPlayerAnswered,
    currentQuestion,
    questionNumber,
    totalQuestions,
    playerAnswers,
    timeLeft,
    showPendingAnswers,
    setShowPendingAnswers,
    handlePlayerBuzzer,
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion,
    showRoundBridge,
    nextNarrator,
    nextRoundNumber,
    startNextRound,
    gameOver
  } = useTriviaGame();

  /* SAFETY: guard against first-render undefined values */
  const safeCurrentRound = currentRound ?? {
    roundNumber: 1,
    narratorId: '',
    questions: [],
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: 90
  };
  const safePlayerAnswers = playerAnswers ?? [];

  /* ───────── Session validation & debugging effects ───────── */
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [
    state.gameId,
    state.pin,
    state.gameStarted,
    state.selectedGame,
    language,
    navigate,
    toast,
    dispatch
  ]);

  useEffect(() => {
    console.log('[TriviaGamePage] Player answers updated:', safePlayerAnswers);
    console.log('[TriviaGamePage] showPendingAnswers value:', showPendingAnswers);
    console.log('[TriviaGamePage] Current player is narrator:', isCurrentNarrator);
    console.log('[TriviaGamePage] Current round:', safeCurrentRound);
    console.log('[TriviaGamePage] Current player:', state.currentPlayer?.id);
    console.log('[TriviaGamePage] Narrator ID:', safeCurrentRound.narratorId);
    console.log('[TriviaGamePage] Next narrator ID:', nextNarrator?.id);

    if (
      safePlayerAnswers.length > 0 &&
      !showPendingAnswers &&
      isCurrentNarrator
    ) {
      setShowPendingAnswers(true);
    }
  }, [
    safePlayerAnswers,
    showPendingAnswers,
    setShowPendingAnswers,
    isCurrentNarrator,
    safeCurrentRound,
    state.currentPlayer?.id,
    nextNarrator
  ]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!state.gameId || !state.pin) return null;

  /* ---- Game-end screen ---- */
  if (gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <GameEndScreen players={state.players} />
        </div>
      </div>
    );
  }

  // Create a wrapper function for startNextRound that adapts it to what RoundBridgePage expects
  const handleStartNextRound = () => {
    startNextRound();
  };

  /* ---- Main game view ---- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <BackgroundMusicController />
      <div className="max-w-4xl mx-auto">
        <GameHeader pin={state.pin} />

        {showRoundBridge ? (
          <RoundBridgePage
            nextRoundNumber={nextRoundNumber}
            nextNarrator={nextNarrator}
            onCountdownComplete={handleStartNextRound}
          />
        ) : isCurrentNarrator ? (
          <NarratorView
            currentQuestion={currentQuestion}
            roundNumber={safeCurrentRound.roundNumber}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            players={state.players}
            playerAnswers={safePlayerAnswers}
            onCorrectAnswer={handleCorrectAnswer}
            onWrongAnswer={handleWrongAnswer}
            onNextQuestion={handleNextQuestion}
            timeLeft={timeLeft}
            showPendingAnswers={showPendingAnswers}
            setShowPendingAnswers={setShowPendingAnswers}
          />
        ) : (
          <PlayerView
            roundNumber={safeCurrentRound.roundNumber}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            players={state.players}
            hasAnswered={hasPlayerAnswered}
            onBuzzerPressed={handlePlayerBuzzer}
            isCurrentPlayerNarrator={isCurrentNarrator}
          />
        )}
      </div>
    </div>
  );
};

export default TriviaGamePage;
