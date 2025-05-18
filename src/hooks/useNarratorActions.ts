import { useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import { Round } from '@/types/trivia';
import { MIN_SCORE_LIMIT } from '@/utils/triviaConstants';
import { broadcastNextQuestion, broadcastRoundEnd } from '@/utils/triviaBroadcast';

export const useNarratorActions = (
  roundNumber: number,
  currentQuestionIndex: number,
  getNextNarrator: () => { nextNarratorId: string; isGameOver: boolean },
  advanceQuestionLocally: (idx: number) => void,
  setNextNarrator: (id: string) => void,
  setShowRoundBridge: (show: boolean) => void,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setGameOver?: (over: boolean) => void
) => {
  const { state, dispatch } = useGame();

  // Award points to the player who answered correctly
  const handleCorrectAnswer = useCallback((playerId: string) => {
    playAudio('success');
    
    // Find player and update score
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    // Award 1 point for correct answer
    const newScore = (player.score || 0) + 1;
    dispatch({
      type: 'UPDATE_SCORE',
      payload: {
        playerId,
        score: newScore
      }
    });
    
    // Update all scores via broadcast (for reliability)
    broadcastNextQuestion(currentQuestionIndex, state.players);
  }, [state.players, currentQuestionIndex, dispatch]);
  
  // Deduct points for wrong answer
  const handleWrongAnswer = useCallback((playerId: string) => {
    playAudio('error');
    
    // Find player and update score
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    
    // Deduct 5 points for wrong answer but don't go below MIN_SCORE_LIMIT
    const newScore = Math.max(MIN_SCORE_LIMIT, (player.score || 0) - 5);
    dispatch({
      type: 'UPDATE_SCORE',
      payload: {
        playerId,
        score: newScore
      }
    });
  }, [state.players, dispatch]);

  // Move to the next question when narrator clicks "Next"
  const handleNextQuestion = useCallback(() => {
    const totalQuestions = 7; // This should match QUESTIONS_PER_ROUND or be passed in
    const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
    
    if (isLastQuestion) {
      // End of round - determine next narrator
      const { nextNarratorId, isGameOver } = getNextNarrator();
      setNextNarrator(nextNarratorId);
      
      // Broadcast round end to all clients
      broadcastRoundEnd(roundNumber, nextNarratorId, state.players, isGameOver);
      
      // Show end screen if game is over
      if (isGameOver && setGameOver) {
        console.log("[useNarratorActions] Game over - last narrator reached");
        setShowRoundBridge(true);
        setTimeout(() => {
          setGameOver(true);
        }, 6500);
      } else {
        // Otherwise show round bridge
        setShowRoundBridge(true);
      }
    } else {
      // Just move to next question
      const nextIndex = currentQuestionIndex + 1;
      advanceQuestionLocally(nextIndex);
      broadcastNextQuestion(nextIndex, state.players);
    }
  }, [
    currentQuestionIndex, 
    roundNumber,
    getNextNarrator,
    setNextNarrator,
    setShowRoundBridge,
    advanceQuestionLocally,
    state.players,
    setGameOver
  ]);
  
  // When the timer runs out
  const handleTimeUp = useCallback(() => {
    // If time's up, treat it like "Next Question" but play a sound
    playAudio('error');
    handleNextQuestion();
  }, [handleNextQuestion]);

  return {
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion,
    handleTimeUp
  };
};
