
import { useState, useCallback } from 'react';
import { Round } from '@/types/trivia';
import { MAX_ROUNDS, QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';
import { broadcastNextQuestion, broadcastRoundEnd } from '@/utils/triviaBroadcast';
import { Player } from '@/context/GameContext';

/**
 * Hook to manage advancing through questions and rounds
 */
export const useRoundProgress = (
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  players: Player[],
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [showRoundBridge, setShowRoundBridge] = useState(false);
  const [nextNarrator, setNextNarrator] = useState<string>('');
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1);
  const [gameOver, setGameOver] = useState(false);

  /**
   * Advance to either the next question or, if the round is over,
   * trigger the round bridge (or end the game).
   */
  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex;
    const last = idx >= QUESTIONS_PER_ROUND - 1;

    if (last) {
      // Round completed
      if (currentRound.roundNumber >= MAX_ROUNDS) {
        // Game over
        broadcastRoundEnd(currentRound.roundNumber, '', players, true);
        setShowRoundBridge(true);
        setTimeout(() => setGameOver(true), 6500);
      } else {
        // Next round
        const order = [...players].sort(
          (a, b) => (a.narrator_order ?? 999) - (b.narrator_order ?? 999)
        );
        const curIx = order.findIndex(p => p.id === currentRound.narratorId);
        const nextId = order[(curIx + 1) % order.length].id;

        setNextNarrator(nextId);
        setNextRoundNumber(currentRound.roundNumber + 1);
        broadcastRoundEnd(currentRound.roundNumber, nextId, players);
        setShowRoundBridge(true);
      }
      return;
    }

    // Same round, advance one question
    const next = idx + 1;
    setCurrentRound(prev => ({
      ...prev,
      currentQuestionIndex: next,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    }));
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
    broadcastNextQuestion(next, players);
  }, [
    currentRound,
    players,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers
  ]);

  return {
    showRoundBridge,
    setShowRoundBridge,
    nextNarrator,
    setNextNarrator,
    nextRoundNumber,
    setNextRoundNumber,
    gameOver,
    setGameOver,
    handleNextQuestion
  };
};
