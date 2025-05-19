
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
  setShowPending: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const [showRoundBridge, setShowRoundBridge] = useState(false);
  const [nextNarrator, setNextNarrator] = useState<string>('');
  const [nextRoundNumber, setNextRoundNumber] = useState(1);
  const [gameOver, setGameOver] = useState(false);

  /**
   * Handle advancing to the next question or round
   */
  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex;
    const last = idx >= QUESTIONS_PER_ROUND - 1;

    if (last) {
      /* ── round finished ── */
      if (currentRound.roundNumber >= MAX_ROUNDS) {
        broadcastRoundEnd(currentRound.roundNumber, '', players, true);
        setShowRoundBridge(true);
        setTimeout(() => setGameOver(true), 6500);
      } else {
        const order = [...players]
          .sort((a,b) => (a.narrator_order ?? 999) - (b.narrator_order ?? 999));
        const curIx = order.findIndex(p => p.id === currentRound.narratorId);
        const nextId = order[(curIx + 1) % order.length].id;
        setNextNarrator(nextId);
        setNextRoundNumber(currentRound.roundNumber + 1);
        broadcastRoundEnd(currentRound.roundNumber, nextId, players);
        setShowRoundBridge(true);
      }
      return;
    }

    /* ── same round, advance one question ── */
    const next = idx + 1;
    setCurrentRound(prev => ({
      ...prev,
      currentQuestionIndex: next,
      playerAnswers: [],
      timeLeft: 90 // QUESTION_TIMER
    }));
    setAnsweredPlayers(new Set());
    setShowPending(false);
    broadcastNextQuestion(next, players);
  }, [currentRound, players, setCurrentRound, setAnsweredPlayers, setShowPending]);

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
