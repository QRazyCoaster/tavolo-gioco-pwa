import { useState } from 'react';
import { broadcastRoundEnd } from '@/utils/triviaBroadcast';
import { mockQuestions, QUESTIONS_PER_ROUND, QUESTION_TIMER } from '@/utils/triviaConstants';
import { TriviaQuestion } from '@/types/trivia';
import { Player } from '@/context/GameContext';

type NextNarratorResult = { nextNarratorId: string; isGameOver: boolean };

export const useRoundTransition = (
  roundNumber: number,
  players: Player[],
  getNextNarrator: () => NextNarratorResult
) => {
  const [showRoundBridge, setShowRoundBridge] = useState(false);
  const [nextNarrator, setNextNarrator] = useState('');
  const [gameOver, setGameOver] = useState(false);

  const handleRoundEnd = () => {
    // Determine next narrator
    const { nextNarratorId, isGameOver } = getNextNarrator();
    setNextNarrator(nextNarratorId);
    
    // Broadcast round end to all clients
    broadcastRoundEnd(roundNumber, nextNarratorId, players, isGameOver);
    
    // Show end screen if game is over
    if (isGameOver) {
      console.log("[useRoundTransition] Game over - last narrator reached");
      setShowRoundBridge(true);
      setTimeout(() => {
        setGameOver(true);
      }, 6500);
    } else {
      // Otherwise show round bridge
      setShowRoundBridge(true);
    }

    return { nextNarratorId, isGameOver };
  };

  const getNewRoundQuestions = (nextRound: number) => {
    return mockQuestions
      .slice(0, QUESTIONS_PER_ROUND)
      .map(q => ({ ...q, id: `r${nextRound}-${q.id}` })) as TriviaQuestion[];
  };

  const startNextRound = (narratorId: string, nextRound: number) => {
    return {
      roundNumber: nextRound,
      narratorId,
      questions: getNewRoundQuestions(nextRound),
      currentQuestionIndex: 0,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    };
  };

  return {
    showRoundBridge,
    setShowRoundBridge,
    nextNarrator,
    setNextNarrator,
    gameOver,
    setGameOver,
    handleRoundEnd,
    getNewRoundQuestions,
    startNextRound
  };
};
