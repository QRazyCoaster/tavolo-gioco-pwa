
import { useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/supabaseClient';
import { useGame } from '@/context/GameContext';
import { TriviaQuestion, PlayerAnswer, Round } from '@/types/trivia';
import { playAudio } from '@/utils/audioUtils';

// ─────────────────────────────────────────────────────────────
//  Shared broadcast channel (one per session)
// ─────────────────────────────────────────────────────────────
let gameChannel: RealtimeChannel | null = null;

// ─────────────────────────────────────────────────────────────
//  Demo questions
// ─────────────────────────────────────────────────────────────
const mockQuestions: TriviaQuestion[] = [
  { id: '1', textEn: 'What is the capital of France?', textIt: 'Qual è la capitale della Francia?', answerEn: 'Paris', answerIt: 'Parigi', categoryId: 'geography', difficulty: 'easy' },
  { id: '2', textEn: 'Who painted the Mona Lisa?', textIt: 'Chi ha dipinto la Monna Lisa?', answerEn: 'Leonardo da Vinci', answerIt: 'Leonardo da Vinci', categoryId: 'art', difficulty: 'easy' },
  { id: '3', textEn: 'What is the chemical symbol for water?', textIt: "Qual è il simbolo chimico dell'acqua?", answerEn: 'H2O', answerIt: 'H2O', categoryId: 'science', difficulty: 'easy' },
  { id: '4', textEn: 'What planet is known as the Red Planet?', textIt: 'Quale pianeta è conosciuto come il Pianeta Rosso?', answerEn: 'Mars', answerIt: 'Marte', categoryId: 'astronomy', difficulty: 'easy' },
  { id: '5', textEn: 'Who wrote "Romeo and Juliet"?', textIt: 'Chi ha scritto "Romeo e Giulietta"?', answerEn: 'William Shakespeare', answerIt: 'William Shakespeare', categoryId: 'literature', difficulty: 'easy' }
];

const QUESTION_TIMER = 90;

// ─────────────────────────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────────────────────────
export const useTriviaGame = () => {
  const { state, dispatch } = useGame();

  const [currentRound, setCurrentRound] = useState<Round>(() => ({
    roundNumber: 1,
    narratorId: state.players.find(p => p.isHost)?.id || '',
    questions: mockQuestions,
    currentQuestionIndex: 0,
    playerAnswers: [],
    timeLeft: QUESTION_TIMER
  }));

  const [answeredPlayers, setAnsweredPlayers] = useState<Set<string>>(new Set());
  const [showPendingAnswers, setShowPendingAnswers] = useState(false);

  const isNarrator        = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = state.currentPlayer ? answeredPlayers.has(state.currentPlayer.id) : false;

  // ────────────────────────────────────────────────────────────
  //  Narrator timer
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isNarrator) return;
    const t = setInterval(() => {
      setCurrentRound(prev => {
        // When timer reaches 0, trigger next question
        if (prev.timeLeft <= 1) {
          const nextIdx = Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1);
          // Important: broadcast scores even on timeout
          broadcastNextQuestion(nextIdx);
          return { 
            ...prev, 
            currentQuestionIndex: nextIdx, 
            playerAnswers: [],
            timeLeft: QUESTION_TIMER 
          };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isNarrator]);

  // ────────────────────────────────────────────────────────────
  //  PLAYER presses the buzzer
  // ────────────────────────────────────────────────────────────
  const handlePlayerBuzzer = useCallback(async () => {
    if (!state.currentPlayer || isNarrator || hasPlayerAnswered || !state.gameId) return;

    window.myBuzzer ? window.myBuzzer.play().catch(() => playAudio('buzzer'))
                    : playAudio('buzzer');

    const questionId = currentRound.questions[currentRound.currentQuestionIndex].id;

    try {
      const { error } = await supabase
        .from('player_answers')
        .insert({ game_id: state.gameId, question_id: questionId, player_id: state.currentPlayer.id });

      if (error && error.code !== '23505') {            // 23505 = duplicate key
        console.error('[handlePlayerBuzzer] insert error', error);
      }
    } catch (err) {
      console.error('[handlePlayerBuzzer] network error', err);
    }

    const optimistic: PlayerAnswer = {
      playerId: state.currentPlayer.id,
      playerName: state.currentPlayer.name,
      timestamp: Date.now()
    };
    setCurrentRound(prev =>
      prev.playerAnswers.some(a => a.playerId === optimistic.playerId)
        ? prev
        : { ...prev, playerAnswers: [...prev.playerAnswers, optimistic] }
    );
    setAnsweredPlayers(prev => new Set(prev).add(state.currentPlayer!.id));
    setShowPendingAnswers(true);
  }, [state.currentPlayer, state.gameId, isNarrator, hasPlayerAnswered, currentRound]);

  // ────────────────────────────────────────────────────────────
  //  Open shared Supabase channel once
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.gameId) return;
    
    if (!gameChannel) {
      console.log(`[useTriviaGame] Creating new game channel for game-${state.gameId}`);
      gameChannel = supabase.channel(`game-${state.gameId}`).subscribe();
    }

    return () => {
      if (gameChannel) {
        console.log('[useTriviaGame] Cleaning up game channel');
        supabase.removeChannel(gameChannel);
        gameChannel = null;
      }
    };
  }, [state.gameId]);

  // ────────────────────────────────────────────────────────────
  //  Narrator listens for INSERTs (player buzzes)
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isNarrator || !state.gameId) return;

    const dbChannel = supabase
      .channel('player_answers_all')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'player_answers' },
        payload => {
          const { player_id, game_id, question_id, created_at } = payload.new as any;
          if (game_id !== state.gameId) return;

          const currentQ = currentRound.questions[currentRound.currentQuestionIndex].id;
          if (question_id !== currentQ) return;

          setCurrentRound(prev => {
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
          setShowPendingAnswers(true);
        })
      .subscribe();

    // cleanup: ignore the Promise return value
    return () => { void supabase.removeChannel(dbChannel); };
  }, [isNarrator, state.gameId, currentRound.currentQuestionIndex, state.players]);

  // ────────────────────────────────────────────────────────────
  //  ALL CLIENTS: Listen for NEXT_QUESTION events & score updates
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.gameId || !gameChannel) return;

    // Clear any existing subscription to avoid duplicates
    gameChannel.unsubscribe();
    
    // Create a new subscription
    const cleanChannel = supabase
      .channel(`game-${state.gameId}`)
      .on('broadcast', { event: 'NEXT_QUESTION' }, ({ payload }) => {
        const { questionIndex, scores } = payload as any;
        
        console.log('[useTriviaGame] Received NEXT_QUESTION broadcast with scores:', scores);

        // Update local round state
        setCurrentRound(prev => ({
          ...prev,
          currentQuestionIndex: questionIndex,
          playerAnswers: [],
          timeLeft: QUESTION_TIMER
        }));
        
        setAnsweredPlayers(new Set());
        setShowPendingAnswers(false);

        // Update all player scores in the GameContext
        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) => {
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
          });
        }
      })
      .on('broadcast', { event: 'SCORE_UPDATE' }, ({ payload }) => {
        const { scores } = payload as any;
        
        console.log('[useTriviaGame] Received SCORE_UPDATE broadcast with scores:', scores);
        
        // Update all player scores in the GameContext
        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) => {
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
          });
        }
      })
      .subscribe();
      
    gameChannel = cleanChannel;

    return () => { void supabase.removeChannel(cleanChannel); };
  }, [state.gameId, dispatch]);

  // ────────────────────────────────────────────────────────────
  //  Helper: Broadcast score updates to all clients
  // ────────────────────────────────────────────────────────────
  const broadcastScoreUpdate = useCallback(() => {
    if (!gameChannel || !state.gameId) return;
    
    // Send current scores from GameContext
    const scores = state.players.map(p => ({ id: p.id, score: p.score || 0 }));
    console.log('[useTriviaGame] Broadcasting score update to all clients:', scores);
    
    gameChannel.send({ 
      type: 'broadcast', 
      event: 'SCORE_UPDATE', 
      payload: { scores } 
    });
  }, [state.players, state.gameId]);

  // ────────────────────────────────────────────────────────────
  //  Helper: Broadcast NEXT_QUESTION with scores to all clients
  // ────────────────────────────────────────────────────────────
  const broadcastNextQuestion = (nextIndex: number) => {
    if (!gameChannel || !state.gameId) return;
    
    // Important: Always send current scores from GameContext
    const scores = state.players.map(p => ({ id: p.id, score: p.score || 0 }));
    console.log('[useTriviaGame] Broadcasting scores with next question to all clients:', scores);
    
    gameChannel.send({ 
      type: 'broadcast', 
      event: 'NEXT_QUESTION', 
      payload: { 
        questionIndex: nextIndex, 
        scores 
      } 
    });
  };

  const advanceQuestionLocally = (update: (idx: number) => number) => {
    setCurrentRound(prev => {
      const nextIdx = update(prev.currentQuestionIndex);
      return { ...prev, currentQuestionIndex: nextIdx, playerAnswers: [], timeLeft: QUESTION_TIMER };
    });
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
  };

  // ────────────────────────────────────────────────────────────
  //  Correct & wrong answers
  // ────────────────────────────────────────────────────────────
  const handleCorrectAnswer = useCallback((playerId: string) => {
    // Update score locally first
    const newScore = (state.players.find(p => p.id === playerId)?.score || 0) + 10;
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });
    
    // Immediately broadcast the updated score to all clients
    broadcastScoreUpdate();

    // Advance to next question
    advanceQuestionLocally(idx => Math.min(idx + 1, currentRound.questions.length - 1));
    
    // Broadcast to all players with UPDATED scores
    broadcastNextQuestion(currentRound.currentQuestionIndex + 1);
    playAudio('success');
  }, [state.players, dispatch, currentRound.questions.length, currentRound.currentQuestionIndex, broadcastScoreUpdate]);

  const handleWrongAnswer = useCallback((playerId: string) => {
    // Update score locally first
    const newScore = Math.max(0, (state.players.find(p => p.id === playerId)?.score || 0) - 5);
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });
    
    // Immediately broadcast the updated score to all clients
    broadcastScoreUpdate();

    setCurrentRound(prev => {
      const remaining = prev.playerAnswers.filter(a => a.playerId !== playerId);
      if (remaining.length === 0) {
        const nextIdx = Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1);
        
        // Broadcast with UPDATED scores
        broadcastNextQuestion(nextIdx);
        
        setAnsweredPlayers(new Set());
        setShowPendingAnswers(false);
        playAudio('notification');
        return { ...prev, currentQuestionIndex: nextIdx, playerAnswers: [], timeLeft: QUESTION_TIMER };
      }
      return { ...prev, playerAnswers: remaining };
    });
    playAudio('error');
  }, [state.players, dispatch, broadcastScoreUpdate]);

  const handleNextQuestion = useCallback(() => {
    advanceQuestionLocally(idx => Math.min(idx + 1, currentRound.questions.length - 1));
    
    // Broadcast with current scores
    broadcastNextQuestion(currentRound.currentQuestionIndex + 1);
    
    playAudio('notification');
  }, [currentRound.questions.length, currentRound.currentQuestionIndex]);

  // ────────────────────────────────────────────────────────────
  //  Return values for components
  // ────────────────────────────────────────────────────────────
  return {
    currentRound,
    isNarrator,
    hasPlayerAnswered,
    currentQuestion: currentRound.questions[currentRound.currentQuestionIndex],
    questionNumber: currentRound.currentQuestionIndex + 1,
    totalQuestions: currentRound.questions.length,
    playerAnswers: currentRound.playerAnswers,
    timeLeft: currentRound.timeLeft,
    showPendingAnswers,
    setShowPendingAnswers,
    handlePlayerBuzzer,
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion
  };
};
