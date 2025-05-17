import { useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { Player } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import { broadcastScoreUpdate, broadcastNextQuestion, broadcastRoundEnd } from '@/utils/triviaBroadcast';
import { QUESTION_TIMER, QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';

export const useNarratorActions = (
  currentRoundNumber: number,
  currentQuestionIndex: number,
  getNextNarrator: () => string,
  advanceQuestionLocally: (nextIndex: number) => void,
  setNextNarrator: React.Dispatch<React.SetStateAction<string>>,
  setShowRoundBridge: React.Dispatch<React.SetStateAction<boolean>>,
  setCurrentRound: React.Dispatch<React.SetStateAction<any>>
) => {
  const { state, dispatch } = useGame();
  
  const handleCorrectAnswer = useCallback((playerId: string) => {
    // Award points for correct answer
    const newScore = (state.players.find(p => p.id === playerId)?.score || 0) + 10;
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });
    
    // Broadcast score update immediately to all players
    setTimeout(() => {
      broadcastScoreUpdate(state.players);
    }, 100);

    // Check if this was the last question of the round
    const isLastQuestionOfRound = currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
    
    if (isLastQuestionOfRound) {
      // End of round - get next narrator and broadcast round end
      const nextNarratorId = getNextNarrator();
      broadcastRoundEnd(currentRoundNumber, nextNarratorId, state.players);
      playAudio('success');
      
      // Show the round bridge for ALL players, including the current narrator
      setShowRoundBridge(true);
      setNextNarrator(nextNarratorId);
    } else {
      // Continue with next question in this round
      const nextIdx = currentQuestionIndex + 1;
      advanceQuestionLocally(nextIdx);
      
      // Build fresh score array including the new score
      const updatedScores = state.players.map(p =>
        p.id === playerId ? { id: p.id, score: newScore } : { id: p.id, score: p.score || 0 }
      );
      broadcastNextQuestion(nextIdx, state.players, updatedScores);
      playAudio('success');
    }
  }, [state.players, dispatch, currentQuestionIndex, getNextNarrator, currentRoundNumber, advanceQuestionLocally, setNextNarrator, setShowRoundBridge]);

  const handleWrongAnswer = useCallback((playerId: string) => {
    // Deduct points for wrong answer
    const newScore = (state.players.find(p => p.id === playerId)?.score || 0) - 5;
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });
    
    // Broadcast score update immediately
    setTimeout(() => {
      broadcastScoreUpdate(state.players);
    }, 100);

    setCurrentRound(prev => {
      // Remove the player who answered incorrectly
      const remaining = prev.playerAnswers.filter(a => a.playerId !== playerId);
      
      // If no more answers, advance to next question or round
      if (remaining.length === 0) {
        const isLastQuestionOfRound = prev.currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
        
        if (isLastQuestionOfRound) {
          // End of round - get next narrator and broadcast round end
          const nextNarratorId = getNextNarrator();
          broadcastRoundEnd(currentRoundNumber, nextNarratorId, state.players);
          
          // Show the round bridge for ALL players, including the current narrator
          setShowRoundBridge(true);
          setNextNarrator(nextNarratorId);
          
          playAudio('notification');
          return prev;
        } else {
          // Continue with next question in this round
          const nextIdx = prev.currentQuestionIndex + 1;
          
          // Update scores before broadcasting
          const updatedScores = state.players.map(p =>
            p.id === playerId ? { id: p.id, score: newScore } : { id: p.id, score: p.score || 0 }
          );
          
          broadcastNextQuestion(nextIdx, state.players, updatedScores);
          playAudio('notification');
          return { ...prev, currentQuestionIndex: nextIdx, playerAnswers: [], timeLeft: QUESTION_TIMER };
        }
      }
      
      // Otherwise just remove this player from answers and continue
      return { ...prev, playerAnswers: remaining };
    });

    playAudio('error');
  }, [state.players, dispatch, getNextNarrator, currentRoundNumber, setNextNarrator, setShowRoundBridge, setCurrentRound]);

  const handleNextQuestion = useCallback(() => {
    // Check if this is the last question of the round
    const isLastQuestionOfRound = currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
    
    if (isLastQuestionOfRound) {
      // End of round - transition to next round
      const nextNarratorId = getNextNarrator();
      broadcastRoundEnd(currentRoundNumber, nextNarratorId, state.players);
      
      // Show the round bridge for ALL players, including the current narrator
      setShowRoundBridge(true);
      setNextNarrator(nextNarratorId);
    } else {
      // Just go to next question in this round
      const nextIdx = currentQuestionIndex + 1;
      advanceQuestionLocally(nextIdx);
      broadcastNextQuestion(nextIdx, state.players);
    }
    
    playAudio('notification');
  }, [currentQuestionIndex, getNextNarrator, currentRoundNumber, state.players, advanceQuestionLocally, setNextNarrator, setShowRoundBridge]);

  const handleTimeUp = () => {
    const isLastQuestionOfRound = currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
    
    if (isLastQuestionOfRound) {
      // End of round - transition to next round
      const nextNarratorId = getNextNarrator();
      setNextNarrator(nextNarratorId);
      broadcastRoundEnd(currentRoundNumber, nextNarratorId, state.players);
      
      // Ensure everyone sees the round bridge
      setShowRoundBridge(true);
    } else {
      // Just proceed to next question in this round
      const nextIdx = currentQuestionIndex + 1;
      advanceQuestionLocally(nextIdx);
      broadcastNextQuestion(nextIdx, state.players);
    }
  };

  return {
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion,
    handleTimeUp
  };
};
