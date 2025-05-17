import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import { useGame } from '@/context/GameContext';
import { Round, TriviaQuestion } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { mockQuestions, QUESTION_TIMER, QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';
import { setGameChannel, broadcastNextQuestion, broadcastRoundEnd, broadcastScoreUpdate } from '@/utils/triviaBroadcast';
import { useQuestionManager } from './useQuestionManager';
import { usePlayerActions } from './usePlayerActions';
import { useNarratorActions } from './useNarratorActions';

export const useTriviaGame = () => {
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const { language } = useLanguage();

  const [currentRound, setCurrentRound] = useState<Round>({
    roundNumber: 1,
    narratorId: state.players.find(p => p.isHost)?.id || '',
    questions: mockQuestions.slice(0, QUESTIONS_PER_ROUND) as TriviaQuestion[],
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER
  });

  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set());
  const [showPendingAnswers, setShowPendingAnswers] = useState(false);
  const [showRoundBridge, setShowRoundBridge] = useState(false);
  const [nextNarrator, setNextNarrator] = useState<string>('');

  // Check if the current player is the narrator based on currentRound.narratorId
  const isNarrator = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = state.currentPlayer ? answeredPlayers.has(state.currentPlayer.id) : false;
  
  // Find the next narrator based on join order when round ends
  const getNextNarrator = useCallback(() => {
    if (currentRound.roundNumber >= state.players.length) {
      // If we've cycled through all players, start over with the host
      return state.players.find(p => p.isHost)?.id || '';
    }
    
    // Otherwise take the player at the roundNumber index (1-indexed, so subtract 1)
    return state.players[currentRound.roundNumber]?.id || state.players[0].id;
  }, [currentRound.roundNumber, state.players]);
  
  // Initialize Question Manager
  const advanceQuestionLocallyRef = (nextIndex: number) => {
    // Update local state to move to the next question
    setCurrentRound(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    }));
    
    // Reset the list of players who have answered
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
  };

  const broadcastNextQuestionRef = (nextIndex: number, scores?: { id: string; score: number }[]) => {
    broadcastNextQuestion(nextIndex, state.players, scores);
  };
  
  const { 
    advanceQuestionLocally, 
    currentQuestion, 
    questionNumber,
    totalQuestions 
  } = useQuestionManager(
    currentRound, 
    setCurrentRound, 
    setAnsweredPlayers, 
    setShowPendingAnswers,
    broadcastNextQuestionRef
  );
  
  // Initialize Player Actions
  const { handlePlayerBuzzer } = usePlayerActions(
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.questions,
    setAnsweredPlayers,
    setCurrentRound,
    setShowPendingAnswers
  );
  
  // Initialize Narrator Actions
  const { 
    handleCorrectAnswer, 
    handleWrongAnswer, 
    handleNextQuestion, 
    handleTimeUp 
  } = useNarratorActions(
    currentRound.roundNumber,
    currentRound.currentQuestionIndex,
    getNextNarrator,
    advanceQuestionLocally,
    setNextNarrator,
    setShowRoundBridge,
    setCurrentRound
  );

  // ─────────────────────────────────────��──────────────────────
  //  Narrator timer
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isNarrator || showRoundBridge) return;
    const t = setInterval(() => {
      setCurrentRound(prev => {
        const newTimeLeft = Math.max(0, prev.timeLeft - 1);
        if (newTimeLeft === 0) {
          // Time's up - proceed to next question or round
          handleTimeUp();
        }
        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isNarrator, showRoundBridge]);
  
  // ────────────────────────────────────────────────────────────
  //  Open shared channel once
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    // Create a channel for this game if it doesn't exist yet
    if (state.gameId) {
      const gameChannel = supabase.channel(`game-${state.gameId}`).subscribe();
      setGameChannel(gameChannel);
    }
  }, [state.gameId]);

  // ────────────────────────────────────────────────────────────
  //  Narrator listens for buzzer INSERTs
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    // Only the current narrator needs to listen for player answers
    if (!isNarrator || !state.gameId) return;

    // Set up a real-time subscription to player_answers table
    const dbChannel = supabase
      .channel('player_answers_all')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'player_answers' },
        payload => {
          const { player_id, game_id, question_id, created_at } = payload.new as any;
          
          // Ignore answers for other games
          if (game_id !== state.gameId) return;

          // Ignore answers for questions other than the current one
          const currentQ = currentRound.questions[currentRound.currentQuestionIndex].id;
          if (question_id !== currentQ) return;

          // Update the list of player answers
          setCurrentRound(prev => {
            // Don't add the same player twice
            if (prev.playerAnswers.some(a => a.playerId === player_id)) return prev;
            
            return {
              ...prev,
              playerAnswers: [
                ...prev.playerAnswers,
                {
                  playerId: player_id,
                  playerName: state.players.find(p => p.id === player_id)?.name || 'Player',
                  timestamp: new Date(created_at).valueOf()
                }
              ]
            };
          });
          
          // Show the pending answers panel to the narrator
          setShowPendingAnswers(true);
        })
      .subscribe();

    // Clean up subscription when component unmounts or narrator changes
    return () => { void supabase.removeChannel(dbChannel); };
  }, [isNarrator, state.gameId, currentRound.currentQuestionIndex, state.players]);

  // ────────────────────────────────────────────────────────────
  //  Listen for broadcasts
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.gameId) return;
    
    // Create a channel for this game
    const gameChannel = supabase.channel(`game-${state.gameId}`);

    // Listen for broadcast events from narrators
    const nextQuestionSub = gameChannel.on('broadcast', { event: 'NEXT_QUESTION' }, ({ payload }) => {
      const { questionIndex, scores } = payload as any;

      // Update the current question
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: questionIndex,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));
      
      // Reset the list of players who have answered
      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);

      // Update scores in game context
      scores.forEach((s: { id: string; score: number }) => {
        dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
      });
    });

    // Listen for score updates
    const scoreUpdateSub = gameChannel.on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
      const { scores } = payload as any;
      console.log('[useTriviaGame] Received SCORE_UPDATE broadcast with scores:', scores);

      // Update player scores in game state
      scores.forEach((s: { id: string; score: number }) => {
        setTimeout(() => {
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
        }, 100);
      });
    });

    // Listen for round end events
    const roundEndSub = gameChannel.on('broadcast', { event: 'ROUND_END' }, ({ payload }) => {
      const { nextRound, nextNarratorId, scores } = payload as any;
      
      console.log('[useTriviaGame] Round ended, showing bridge page');
      
      // Update scores
      scores.forEach((s: { id: string; score: number }) => {
        dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
      });
      
      // Set next narrator and show round bridge for ALL players
      setNextNarrator(nextNarratorId);
      setShowRoundBridge(true);
      
      // After round bridge is shown, prepare for the next round
      setTimeout(() => {
        // Update the narrator ID in the current round state to switch views for all players
        setCurrentRound(prev => ({
          ...prev,
          roundNumber: nextRound,
          narratorId: nextNarratorId,
          currentQuestionIndex: 0,
          playerAnswers: [],
          timeLeft: QUESTION_TIMER
        }));
      }, 6500); // Slightly longer than the bridge page display time
    });

    // Subscribe to the channel
    gameChannel.subscribe();

    // Return cleanup functions
    return () => { 
      void supabase.removeChannel(gameChannel); 
    };
  }, [state.gameId, dispatch]);

  const startNextRound = () => {
    // Hide the round bridge
    setShowRoundBridge(false);
    
    // Ensure the narratorId is properly updated when starting the new round
    // This is critical for the view transition between narrator and player roles
    setCurrentRound(prev => ({
      ...prev,
      narratorId: nextNarrator,
    }));
  };

  // ────────────────────────────────────────────────────────────
  //  Return values for components
  // ────────────────────────────────────────────────────────────
  return {
    currentRound,
    isNarrator,
    hasPlayerAnswered,
    currentQuestion,
    questionNumber,
    totalQuestions,
    playerAnswers: currentRound.playerAnswers,
    timeLeft: currentRound.timeLeft,
    showPendingAnswers,
    setShowPendingAnswers,
    handlePlayerBuzzer,
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion,
    showRoundBridge,
    nextNarrator: state.players.find(p => p.id === nextNarrator),
    nextRoundNumber: currentRound.roundNumber + 1,
    startNextRound
  };
};
