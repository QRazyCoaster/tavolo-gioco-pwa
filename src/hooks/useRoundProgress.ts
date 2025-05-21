// src/hooks/useRoundProgress.ts

import { useState, useCallback, useEffect } from 'react';
import { Round } from '@/types/trivia';
import { QUESTION_TIMER } from '@/utils/triviaConstants';
import { broadcastNextQuestion, broadcastRoundEnd } from '@/utils/triviaBroadcast';
import { Player } from '@/context/GameContext';

/**
 * Manages advancing through questions and rounds, now using narrator_order.
 */
export const useRoundProgress = (
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  players: Player[],
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPending: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [showRoundBridge, setShowRoundBridge] = useState(false);
  const [nextNarrator, setNextNarrator] = useState<string>('');
  const [nextRoundNumber, setNextRoundNumber] = useState<number>(1);
  const [gameOver, setGameOver] = useState(false);
  
  const handleNextQuestion = useCallback(() => {
    const idx = currentRound.currentQuestionIndex;
    const lastQuestion = idx >= currentRound.questions.length - 1;

    if (lastQuestion) {
      // End of questions → end of this round
      const maxOrder = players.reduce((m, p) => Math.max(m, p.narrator_order ?? 0), 0);

      if (currentRound.roundNumber >= maxOrder) {
        // FINAL ROUND
        broadcastRoundEnd(currentRound.roundNumber, '', players, true);
        setShowRoundBridge(true);
        setTimeout(() => setGameOver(true), 6500);
      } else {
        // NEXT ROUND
        const nextOrder = currentRound.roundNumber + 1;
        const nextPlayer = players.find(p => p.narrator_order === nextOrder);
        const nextId = nextPlayer?.id ?? players[0].id;

        broadcastRoundEnd(currentRound.roundNumber, nextId, players);
        setNextNarrator(nextId);
        setNextRoundNumber(nextOrder);
        setShowRoundBridge(true);
      }
    } else {
      // Same round, next question
      const nextIndex = idx + 1;
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: nextIndex,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      setAnsweredPlayers(new Set());
      setShowPending(false);
      broadcastNextQuestion(nextIndex, players);
    }
  }, [currentRound, players, setCurrentRound, setAnsweredPlayers, setShowPending]);

  const startNextRound = () => {
    setCurrentRound(prev => ({
      roundNumber: nextRoundNumber,
      narratorId: nextNarrator,
      questions: prev.questions.map(q => ({ ...q, id: `r${nextRoundNumber}-${q.id}` })),
      currentQuestionIndex: 0,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    }));
    setAnsweredPlayers(new Set());
    setShowPending(false);
    setShowRoundBridge(false);
  };

  return {
    showRoundBridge,
    nextNarrator,
    nextRoundNumber,
    gameOver,
    handleNextQuestion,
    startNextRound
  };
};
