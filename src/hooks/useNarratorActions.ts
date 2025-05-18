
import { useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Round, PlayerAnswer } from '@/types/trivia';
import { GameState } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import {
  broadcastNextQuestion,
  broadcastRoundEnd,
  broadcastScoreUpdate
} from '@/utils/triviaBroadcast';
import { MAX_ROUNDS } from '@/utils/triviaConstants';

// Constants for point values
export const CORRECT_ANSWER_POINTS = 10;
export const WRONG_ANSWER_POINTS = -5;

export const useNarratorActions = (
  state: GameState,
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  gameChannel: RealtimeChannel | null,
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  setShowRoundBridge: React.Dispatch<React.SetStateAction<boolean>>,
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>,
  dispatch: any
) => {
  // Award points to player with correct answer
  const handleCorrectAnswer = useCallback(
    (playerId: string) => {
      if (!state.currentPlayer?.isHost) return;
      
      // Find player who answered correctly
      const player = state.players.find(p => p.id === playerId);
      if (!player) return;

      // Play success sound
      playAudio('success');

      console.log(`[useNarratorActions] Awarding ${CORRECT_ANSWER_POINTS} points to ${player.name}`);

      // Calculate new score (ensuring we protect against undefined scores)
      const currentScore = player.score || 0;
      const newScore = currentScore + CORRECT_ANSWER_POINTS;

      // Update local state
      dispatch({
        type: 'UPDATE_SCORE',
        payload: { playerId, score: newScore }
      });

      // Remove from pending answers
      const updatedAnswers = currentRound.playerAnswers.filter(
        a => a.playerId !== playerId
      );

      // Update round state
      setCurrentRound(prev => ({
        ...prev,
        playerAnswers: updatedAnswers
      }));

      // Broadcast score update to all players
      broadcastScoreUpdate(state.players.map(p => 
        p.id === playerId 
          ? { ...p, score: newScore } 
          : p
      ));
      
      // Automatically move to the next question after awarding points
      setTimeout(() => {
        handleNextQuestion();
      }, 1500); // Give a short delay so players can see their score update
    },
    [state.currentPlayer, state.players, currentRound, setCurrentRound, dispatch]
  );

  // Penalize player with wrong answer
  const handleWrongAnswer = useCallback(
    (playerId: string) => {
      if (!state.currentPlayer?.isHost) return;
      
      // Find player who answered incorrectly
      const player = state.players.find(p => p.id === playerId);
      if (!player) return;

      // Play error sound
      playAudio('error');

      console.log(`[useNarratorActions] Deducting ${Math.abs(WRONG_ANSWER_POINTS)} points from ${player.name}`);

      // Calculate new score (ensuring we protect against undefined scores)
      const currentScore = player.score || 0;
      const newScore = currentScore + WRONG_ANSWER_POINTS; // Adding negative points

      // Update local state
      dispatch({
        type: 'UPDATE_SCORE',
        payload: { playerId, score: newScore }
      });

      // Remove from pending answers
      const updatedAnswers = currentRound.playerAnswers.filter(
        a => a.playerId !== playerId
      );

      // Update round state
      setCurrentRound(prev => ({
        ...prev,
        playerAnswers: updatedAnswers
      }));

      // Broadcast score update to all players
      broadcastScoreUpdate(state.players.map(p => 
        p.id === playerId 
          ? { ...p, score: newScore } 
          : p
      ));
      
      // No automatic next question after wrong answer - let other players try
      // If this was the last player in queue, automatically move to next question
      if (updatedAnswers.length === 0) {
        setTimeout(() => {
          handleNextQuestion();
        }, 1500);
      }
    },
    [state.currentPlayer, state.players, currentRound, setCurrentRound, dispatch]
  );

  // Move to next question or round
  const handleNextQuestion = useCallback(() => {
    if (!state.currentPlayer?.isHost) return;
    
    // Get current question index
    const currentQuestionIndex = currentRound.currentQuestionIndex;
    const totalQuestions = currentRound.questions.length;
    
    console.log(`[useNarratorActions] Moving to next question. Current: ${currentQuestionIndex}, Total: ${totalQuestions}`);
    
    // Check if we're at the end of this round's questions
    if (currentQuestionIndex < totalQuestions - 1) {
      // Move to next question in current round
      const nextQuestionIndex = currentQuestionIndex + 1;
      
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: nextQuestionIndex,
        playerAnswers: [],
        timeLeft: 90 // Reset timer
      }));
      
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      
      // Broadcast to all connected players
      broadcastNextQuestion(nextQuestionIndex, state.players);
      
    } else {
      console.log(`[useNarratorActions] End of round ${currentRound.roundNumber} reached`);
      
      // Check if we've reached the maximum number of rounds
      if (currentRound.roundNumber >= MAX_ROUNDS) {
        console.log('[useNarratorActions] Maximum rounds reached, game over');
        
        // End the game
        broadcastRoundEnd(
          currentRound.roundNumber,
          '', // No next narrator
          state.players,
          true // Game over flag
        );
        
        setShowRoundBridge(true);
        
        // Set game over after the round bridge animation
        setTimeout(() => {
          setGameOver(true);
        }, 5000);
        
      } else {
        // End of round but not end of game
        // Choose next narrator (could be improved with a more strategic selection)
        const nextNarratorIndex = currentRound.roundNumber % state.players.length;
        const nextNarratorId = state.players[nextNarratorIndex]?.id || state.players[0].id;
        
        console.log(`[useNarratorActions] Next narrator: ${nextNarratorId}`);
        
        // Broadcast round end to all players
        broadcastRoundEnd(
          currentRound.roundNumber,
          nextNarratorId,
          state.players
        );
        
        // Show round transition UI
        setShowRoundBridge(true);
      }
    }
  }, [
    state.currentPlayer,
    state.players,
    currentRound,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setShowRoundBridge,
    setGameOver
  ]);

  return {
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion
  };
};
