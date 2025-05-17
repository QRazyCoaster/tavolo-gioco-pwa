
import { useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/supabaseClient';
import { useGame } from '@/context/GameContext';
import { TriviaQuestion, PlayerAnswer, Round } from '@/types/trivia';
import { playAudio } from '@/utils/audioUtils';

// ─────────────────────────────────────────────────────────────
//  Shared broadcast channel (singleton)
// ─────────────────────────────────────────────────────────────
let gameChannel: RealtimeChannel | null = null;

// ─────────────────────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────────────────────
const QUESTION_TIMER = 90;
const QUESTIONS_PER_ROUND = 7;

// ─────────────────────────────────────────────────────────────
//  Demo questions
// ─────────────────────────────────────────────────────────────
const mockQuestions: TriviaQuestion[] = [
  { id: '1', textEn: 'What is the capital of France?', textIt: 'Qual è la capitale della Francia?', answerEn: 'Paris', answerIt: 'Parigi', categoryId: 'geography', difficulty: 'easy' },
  { id: '2', textEn: 'Who painted the Mona Lisa?', textIt: 'Chi ha dipinto la Monna Lisa?', answerEn: 'Leonardo da Vinci', answerIt: 'Leonardo da Vinci', categoryId: 'art', difficulty: 'easy' },
  { id: '3', textEn: 'What is the chemical symbol for water?', textIt: "Qual è il simbolo chimico dell'acqua?", answerEn: 'H2O', answerIt: 'H2O', categoryId: 'science', difficulty: 'easy' },
  { id: '4', textEn: 'What planet is known as the Red Planet?', textIt: 'Quale pianeta è conosciuto come il Pianeta Rosso?', answerEn: 'Mars', answerIt: 'Marte', categoryId: 'astronomy', difficulty: 'easy' },
  { id: '5', textEn: 'Who wrote "Romeo and Juliet"?', textIt: 'Chi ha scritto "Romeo e Giulietta"?', answerEn: 'William Shakespeare', answerIt: 'William Shakespeare', categoryId: 'literature', difficulty: 'easy' },
  {
    id: '6',
    textEn: 'In what year did the Titanic sink?',
    textIt: 'In che anno affondò il Titanic?',
    answerEn: '1912',
    answerIt: '1912',
    categoryId: 'history',
    difficulty: 'easy'
  },
  {
    id: '7',
    textEn: 'Which gas do plants absorb from the atmosphere?',
    textIt: 'Quale gas assorbono le piante dall'atmosfera?',
    answerEn: 'Carbon dioxide',
    answerIt: 'Anidride carbonica',
    categoryId: 'science',
    difficulty: 'easy'
  },
  {
    id: '8',
    textEn: 'Am i getting good or not? aha',
    textIt: 'Am i getting good or not? aha?',
    answerEn: 'Yeye',
    answerIt: 'yeye',
    categoryId: 'history',
    difficulty: 'easy'
  },
];

// ─────────────────────────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────────────────────────
export const useTriviaGame = () => {
  const { state, dispatch } = useGame();

  const [currentRound, setCurrentRound] = useState<Round>(() => ({
    roundNumber: 1,
    narratorId: state.players.find(p => p.isHost)?.id || '',
    questions: mockQuestions.slice(0, QUESTIONS_PER_ROUND),
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER
  }));

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

  // ────────────────────────────────────────────────────────────
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

  // Handle when timer reaches zero
  const handleTimeUp = () => {
    const isLastQuestionOfRound = currentRound.currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
    
    if (isLastQuestionOfRound) {
      // End of round - transition to next round
      const nextNarratorId = getNextNarrator();
      setNextNarrator(nextNarratorId);
      broadcastRoundEnd(nextNarratorId);
      
      // Ensure everyone sees the round bridge
      setShowRoundBridge(true);
    } else {
      // Just proceed to next question in this round
      const nextIdx = currentRound.currentQuestionIndex + 1;
      advanceQuestionLocally(nextIdx);
      broadcastNextQuestion(nextIdx);
    }
  };

  // ────────────────────────────────────────────────────────────
  //  PLAYER presses the buzzer
  // ────────────────────────────────────────────────────────────
  const handlePlayerBuzzer = useCallback(async () => {
    // Make sure the current player isn't the narrator, hasn't already answered, and there's a valid game
    if (!state.currentPlayer || isNarrator || hasPlayerAnswered || !state.gameId) return;

    // Play buzzer sound
    window.myBuzzer ? window.myBuzzer.play().catch(() => playAudio('buzzer'))
                    : playAudio('buzzer');

    // Get the current question ID
    const questionId = currentRound.questions[currentRound.currentQuestionIndex].id;

    try {
      // Store the answer in the database
      const { error } = await supabase
        .from('player_answers')
        .insert({ game_id: state.gameId, question_id: questionId, player_id: state.currentPlayer.id });

      if (error && error.code !== '23505') {
        console.error('[handlePlayerBuzzer] insert error', error);
      }
    } catch (err) {
      console.error('[handlePlayerBuzzer] network error', err);
    }

    // Optimistically update local state for quick UI feedback
    const optimistic: PlayerAnswer = {
      playerId: state.currentPlayer.id,
      playerName: state.currentPlayer.name,
      timestamp: Date.now()
    };
    
    // Add the player to the answer list if not already there
    setCurrentRound(prev =>
      prev.playerAnswers.some(a => a.playerId === optimistic.playerId)
        ? prev
        : { ...prev, playerAnswers: [...prev.playerAnswers, optimistic] }
    );
    
    // Mark this player as having answered
    setAnsweredPlayers(prev => new Set(prev).add(state.currentPlayer!.id));
    
    // Make sure the narrator sees the pending answers
    setShowPendingAnswers(true);
  }, [state.currentPlayer, state.gameId, isNarrator, hasPlayerAnswered, currentRound]);

  // ────────────────────────────────────────────────────────────
  //  Open shared channel once
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    // Create a channel for this game if it doesn't exist yet
    if (state.gameId && !gameChannel) {
      gameChannel = supabase.channel(`game-${state.gameId}`).subscribe();
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
    if (!state.gameId || !gameChannel) return;

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

    // Return cleanup functions
    return () => { 
      void nextQuestionSub;
      void scoreUpdateSub;
      void roundEndSub;
    };
  }, [state.gameId, dispatch]);

  // ────────────────────────────────────────────────────────────
  // Broadcast helper functions
  // ────────────────────────────────────────────────────────────
  const broadcastScoreUpdate = () => {
    if (!gameChannel) return;
    
    // Get current scores from game state
    const scores = state.players.map(p => ({ id: p.id, score: p.score || 0 }));
    console.log('[useTriviaGame] Broadcasting score update to all clients:', scores);
    
    // Send score updates to all players
    gameChannel.send({
      type: 'broadcast',
      event: 'SCORE_UPDATE',
      payload: { scores }
    });
  };

  const broadcastNextQuestion = (
    nextIndex: number,
    scores?: { id: string; score: number }[]
  ) => {
    if (!gameChannel) return;
    
    // Use provided scores or get current scores from game state
    const payloadScores = scores ?? state.players.map(p => ({ id: p.id, score: p.score || 0 }));
    console.log('[useTriviaGame] Broadcasting next question with scores:', payloadScores);
    
    // Send next question event to all players
    gameChannel.send({
      type: 'broadcast',
      event: 'NEXT_QUESTION',
      payload: { questionIndex: nextIndex, scores: payloadScores }
    });
  };

  const broadcastRoundEnd = (nextNarratorId: string) => {
    if (!gameChannel) return;
    
    // Get current scores from game state
    const scores = state.players.map(p => ({ id: p.id, score: p.score || 0 }));
    
    // Send round end event to all players
    gameChannel.send({
      type: 'broadcast',
      event: 'ROUND_END',
      payload: { 
        nextRound: currentRound.roundNumber + 1,
        nextNarratorId,
        scores
      }
    });
  };

  // ────────────────────────────────────────────────────────────
  // Question management helpers
  // ────────────────────────────────────────────────────────────
  const advanceQuestionLocally = (nextIndex: number) => {
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
  //  Correct answer
  // ────────────────────────────────────────────────────────────
  const handleCorrectAnswer = useCallback((playerId: string) => {
    // Award points for correct answer
    const newScore = (state.players.find(p => p.id === playerId)?.score || 0) + 10;
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });
    
    // Broadcast score update immediately to all players
    setTimeout(() => {
      broadcastScoreUpdate();
    }, 100);

    // Check if this was the last question of the round
    const isLastQuestionOfRound = currentRound.currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
    
    if (isLastQuestionOfRound) {
      // End of round - get next narrator and broadcast round end
      const nextNarratorId = getNextNarrator();
      broadcastRoundEnd(nextNarratorId);
      playAudio('success');
      
      // Show the round bridge for ALL players, including the current narrator
      setShowRoundBridge(true);
      setNextNarrator(nextNarratorId);
    } else {
      // Continue with next question in this round
      const nextIdx = currentRound.currentQuestionIndex + 1;
      advanceQuestionLocally(nextIdx);
      
      // Build fresh score array including the new score
      const updatedScores = state.players.map(p =>
        p.id === playerId ? { id: p.id, score: newScore } : { id: p.id, score: p.score || 0 }
      );
      broadcastNextQuestion(nextIdx, updatedScores);
      playAudio('success');
    }
  }, [state.players, dispatch, currentRound.currentQuestionIndex, getNextNarrator]);

  // ────────────────────────────────────────────────────────────
  //  Wrong answer
  // ────────────────────────────────────────────────────────────
  const handleWrongAnswer = useCallback((playerId: string) => {
    // Deduct points for wrong answer
    const newScore = (state.players.find(p => p.id === playerId)?.score || 0) - 5;
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });
    
    // Broadcast score update immediately
    setTimeout(() => {
      broadcastScoreUpdate();
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
          broadcastRoundEnd(nextNarratorId);
          
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
          
          broadcastNextQuestion(nextIdx, updatedScores);
          playAudio('notification');
          return { ...prev, currentQuestionIndex: nextIdx, playerAnswers: [], timeLeft: QUESTION_TIMER };
        }
      }
      
      // Otherwise just remove this player from answers and continue
      return { ...prev, playerAnswers: remaining };
    });

    playAudio('error');
  }, [state.players, dispatch, getNextNarrator]);

  // ────────────────────────────────────────────────────────────
  //  Manual next question
  // ────────────────────────────────────────────────────────────
  const handleNextQuestion = useCallback(() => {
    // Check if this is the last question of the round
    const isLastQuestionOfRound = currentRound.currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
    
    if (isLastQuestionOfRound) {
      // End of round - transition to next round
      const nextNarratorId = getNextNarrator();
      broadcastRoundEnd(nextNarratorId);
      
      // Show the round bridge for ALL players, including the current narrator
      setShowRoundBridge(true);
      setNextNarrator(nextNarratorId);
    } else {
      // Just go to next question in this round
      const nextIdx = currentRound.currentQuestionIndex + 1;
      advanceQuestionLocally(nextIdx);
      broadcastNextQuestion(nextIdx);
    }
    
    playAudio('notification');
  }, [currentRound.currentQuestionIndex, getNextNarrator]);

  // ────────────────────────────────────────────────────────────
  //  Return values for components
  // ────────────────────────────────────────────────────────────
  return {
    currentRound,
    isNarrator,
    hasPlayerAnswered,
    currentQuestion: currentRound.questions[currentRound.currentQuestionIndex],
    questionNumber: currentRound.currentQuestionIndex + 1,
    totalQuestions: QUESTIONS_PER_ROUND,
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
