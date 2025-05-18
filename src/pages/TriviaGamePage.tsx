import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { useTriviaGame } from '@/hooks/useTriviaGame';
import { Button } from '@/components/ui/button';
import NarratorView from '@/components/trivia/NarratorView';
import PlayerView   from '@/components/trivia/PlayerView';
import RoundBridgePage from '@/components/trivia/RoundBridgePage';
import GameEndScreen   from '@/components/trivia/GameEndScreen';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Player } from '@/context/GameContext';

const TriviaGamePage = () => {
  const { t, language } = useLanguage();
  const navigate        = useNavigate();
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  /* ─────────── Game-round hook ─────────── */
  const {
    currentRound,
    isNarrator,
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

  /* ──────────────────────────────────────────────
     Stop waiting-room music when game page mounts
  ────────────────────────────────────────────── */
  useEffect(() => {
    if (state.backgroundMusicPlaying && (window as any).waitMusic) {
      (window as any).waitMusic.pause();
      (window as any).waitMusic.currentTime = 0;
      dispatch({ type: 'STOP_BACKGROUND_MUSIC' });
    }
  }, []); // runs once

  /* ───────── Session-validation effect (unchanged) ───────── */
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);

    /* … your original validation logic remains here … */

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

  /* ---- debug effect ---- */
  useEffect(() => {
    console.log('[TriviaGamePage] Player answers updated:', safePlayerAnswers);
    console.log('[TriviaGamePage] showPendingAnswers value:', showPendingAnswers);
    console.log('[TriviaGamePage] Current player is narrator:', isNarrator);
    console.log('[TriviaGamePage] Current round:', safeCurrentRound);
    console.log('[TriviaGamePage] Current player:', state.currentPlayer?.id);
    console.log('[TriviaGamePage] Narrator ID:', safeCurrentRound.narratorId);

    if (
      safePlayerAnswers.length > 0 &&
      !showPendingAnswers &&
      isNarrator
    ) {
      setShowPendingAnswers(true);
    }
  }, [
    safePlayerAnswers,
    showPendingAnswers,
    setShowPendingAnswers,
    isNarrator,
    safeCurrentRound,
    state.currentPlayer?.id
  ]);

  const handleBackToLobby = () => navigate('/waiting-room');

  /* ---- Loading spinner ---- */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse flex space-x-2 mb-4 justify-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full" />
            <div className="w-3 h-3 bg-blue-400 rounded-full" />
            <div className="w-3 h-3 bg-blue-400 rounded-full" />
          </div>
          <p className="text-gray-600">
            {language === 'it' ? 'Caricamento...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
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

  // Find the actual player object that corresponds to the nextNarrator ID
  const nextNarratorPlayer = state.players.find(player => player.id === nextNarrator) || null;

  /* ---- Main game view ---- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToLobby}
              className="mr-2"
            >
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Trivia</h1>
          </div>

          <div className="bg-primary px-3 py-1 rounded-lg text-white text-center">
            <span className="text-sm font-semibold">{t('common.pin')}: </span>
            <span className="text-lg font-bold tracking-wider">{state.pin}</span>
          </div>
        </div>

        {showRoundBridge ? (
          <RoundBridgePage
            nextRoundNumber={nextRoundNumber}
            nextNarrator={nextNarratorPlayer}
            onCountdownComplete={startNextRound}
          />
        ) : isNarrator ? (
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
            isCurrentPlayerNarrator={isNarrator}
          />
        )}
      </div>
    </div>
  );
};

export default TriviaGamePage;
