
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { useGame } from '@/context/GameContext';
import { Round, TriviaQuestion, PlayerAnswer } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { mockQuestions, QUESTION_TIMER, QUESTIONS_PER_ROUND } from '@/utils/triviaConstants';
import { setGameChannel, broadcastNextQuestion, broadcastRoundEnd, broadcastScoreUpdate, cleanupChannel } from '@/utils/triviaBroadcast';
import { useQuestionManager } from './useQuestionManager';
import { usePlayerActions } from './usePlayerActions';
import { useNarratorActions } from './useNarratorActions';

export const useTriviaGame = () => {
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const { language } = useLanguage();

  // Track if we've set up subscriptions to prevent duplicates
  const narratorSubscriptionRef = useRef<any>(null);
  const broadcastSubscriptionRef = useRef<any>(null);
  const gameChannelRef = useRef<any>(null);

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
  const [playerAnswerTimeouts, setPlayerAnswerTimeouts] = useState<{[playerId: string]: NodeJS.Timeout}>({});

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

    // Clear any existing timeouts
    Object.values(playerAnswerTimeouts).forEach(timeout => clearTimeout(timeout));
    setPlayerAnswerTimeouts({});
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

  // ─────────────────────────────────────────────────────────────
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
    if (state.gameId && !gameChannelRef.current) {
      console.log('[useTriviaGame] Setting up game channel for game:', state.gameId);
      const gameChannel = supabase.channel(`game-${state.gameId}`);
      gameChannel.subscribe();
      setGameChannel(gameChannel);
      gameChannelRef.current = gameChannel;
      
      return () => {
        console.log('[useTriviaGame] Cleaning up game channel');
        cleanupChannel();
        gameChannelRef.current = null;
      };
    }
  }, [state.gameId]);

  // ────────────────────────────────────────────────────────────
  //  Narrator listens for buzzer INSERTs
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    // Only the current narrator needs to listen for player answers
    if (!isNarrator || !state.gameId) {
      // If we're not the narrator anymore, cleanup the subscription
      if (narratorSubscriptionRef.current) {
        console.log('[useTriviaGame] Cleaning up narrator subscription');
        supabase.removeChannel(narratorSubscriptionRef.current);
        narratorSubscriptionRef.current = null;
      }
      return;
    }

    // If we already have a subscription active, don't create another one
    if (narratorSubscriptionRef.current) {
      console.log('[useTriviaGame] Narrator subscription already exists, skipping');
      return;
    }

    console.log('[useTriviaGame] Setting up narrator subscription for player answers:', {
      isNarrator,
      gameId: state.gameId
    });

    // Set up a real-time subscription to player_answers table
    const channelName = `player_answers_for_narrator_${state.gameId}`;
    const dbChannel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'player_answers' },
        payload => {
          const { player_id, game_id, question_id, created_at } = payload.new as any;
          
          console.log('[useTriviaGame] Received player answer:', payload.new);
          
          // Ignore answers for other games
          if (game_id !== state.gameId) {
            console.log('[useTriviaGame] Ignoring answer for different game');
            return;
          }

          // Ignore answers for questions other than the current one
          const currentQ = currentRound.questions[currentRound.currentQuestionIndex]?.id;
          if (!currentQ || question_id !== currentQ) {
            console.log('[useTriviaGame] Ignoring answer for different question');
            return;
          }

          // Add a small delay for reliability
          const timeout = setTimeout(() => {
            // Update the list of player answers
            setCurrentRound(prev => {
              // Don't add the same player twice
              if (prev.playerAnswers.some(a => a.playerId === player_id)) {
                console.log('[useTriviaGame] Player already in answers list');
                return prev;
              }
              
              const player = state.players.find(p => p.id === player_id);
              if (!player) {
                console.warn('[useTriviaGame] Player not found:', player_id);
                return prev;
              }

              const newAnswers: PlayerAnswer[] = [
                ...prev.playerAnswers,
                {
                  playerId: player_id,
                  playerName: player.name,
                  timestamp: new Date(created_at).valueOf()
                }
              ];

              console.log('[useTriviaGame] Updated player answers:', newAnswers);
              return { ...prev, playerAnswers: newAnswers };
            });
            
            // Show the pending answers panel to the narrator
            setShowPendingAnswers(true);

            // Clear this timeout from the state
            setPlayerAnswerTimeouts(prev => {
              const newTimeouts = {...prev};
              delete newTimeouts[player_id];
              return newTimeouts;
            });

          }, 200); // Small delay to ensure UI synchronization

          // Store timeout to clear if needed
          setPlayerAnswerTimeouts(prev => ({
            ...prev,
            [player_id]: timeout
          }));
        })
      .subscribe();
    
    // Store the subscription reference
    narratorSubscriptionRef.current = dbChannel;

    // Clean up subscription when component unmounts or narrator changes
    return () => { 
      console.log('[useTriviaGame] Cleaning up narrator subscription');
      if (narratorSubscriptionRef.current) {
        supabase.removeChannel(narratorSubscriptionRef.current);
        narratorSubscriptionRef.current = null;
      }
      
      // Clear any pending timeouts
      Object.values(playerAnswerTimeouts).forEach(timeout => clearTimeout(timeout));
      setPlayerAnswerTimeouts({});
    };
  }, [isNarrator, state.gameId, currentRound.currentQuestionIndex, state.players, playerAnswerTimeouts, state.currentPlayer?.id, currentRound.narratorId]);

  // ────────────────────────────────────────────────────────────
  //  Listen for broadcasts
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.gameId) return;
    
    // If we already have a broadcast subscription, don't create another one
    if (broadcastSubscriptionRef.current) {
      return;
    }
    
    // Create a channel for this game
    const gameChannel = supabase.channel(`game-broadcast-${state.gameId}`);

    console.log('[useTriviaGame] Setting up broadcast listeners for game:', state.gameId);

    // Listen for broadcast events from narrators
    const nextQuestionSub = gameChannel.on('broadcast', { event: 'NEXT_QUESTION' }, ({ payload }) => {
      console.log('[useTriviaGame] Received NEXT_QUESTION broadcast:', payload);
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

      // Clear any existing timeouts
      Object.values(playerAnswerTimeouts).forEach(timeout => clearTimeout(timeout));
      setPlayerAnswerTimeouts({});

      // Update scores in game context if provided
      if (scores && Array.isArray(scores)) {
        console.log('[useTriviaGame] Updating scores from broadcast:', scores);
        scores.forEach((s: { id: string; score: number }) => {
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
        });
      }
    });

    // Listen for score updates
    const scoreUpdateSub = gameChannel.on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
      const { scores } = payload as any;
      console.log('[useTriviaGame] Received SCORE_UPDATE broadcast with scores:', scores);

      // Update player scores in game state
      if (scores && Array.isArray(scores)) {
        scores.forEach((s: { id: string; score: number }) => {
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
        });
      }
    });

    // Listen for round end events
    const roundEndSub = gameChannel.on('broadcast', { event: 'ROUND_END' }, ({ payload }) => {
      const { nextRound, nextNarratorId, scores } = payload as any;
      
      console.log('[useTriviaGame] Round ended, showing bridge page:', payload);
      
      // Update scores if provided
      if (scores && Array.isArray(scores)) {
        scores.forEach((s: { id: string; score: number }) => {
          dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
        });
      }
      
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
    
    // Store the subscription reference
    broadcastSubscriptionRef.current = gameChannel;

    // Return cleanup functions
    return () => { 
      console.log('[useTriviaGame] Cleaning up broadcast listeners');
      if (broadcastSubscriptionRef.current) {
        supabase.removeChannel(broadcastSubscriptionRef.current);
        broadcastSubscriptionRef.current = null;
      }
      
      // Clear any pending timeouts
      Object.values(playerAnswerTimeouts).forEach(timeout => clearTimeout(timeout));
      setPlayerAnswerTimeouts({});
    };
  }, [state.gameId, dispatch, playerAnswerTimeouts]);

  const startNextRound = () => {
    // Hide the round bridge
    setShowRoundBridge(false);
    
    // Ensure the narratorId is properly updated when starting the new round
    // This is critical for the view transition between narrator and player roles
    setCurrentRound(prev => ({
      ...prev,
      narratorId: nextNarrator,
    }));

    // Force the UI to update when the round starts
    setTimeout(() => {
      broadcastScoreUpdate(state.players);
    }, 300);
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
