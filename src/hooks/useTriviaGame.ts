import { useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/supabaseClient';
import { useGame } from '@/context/GameContext';
import { TriviaQuestion, PlayerAnswer, Round } from '@/types/trivia';
import { playAudio } from '@/utils/audioUtils';

// ─────────────────────────────────────────────────────────────
//  Shared broadcast channel (one per browser session)
// ─────────────────────────────────────────────────────────────
let gameChannel: RealtimeChannel | null = null;

// ─────────────────────────────────────────────────────────────
//  Demo questions (replace with a Supabase fetch later)
// ─────────────────────────────────────────────────────────────
const mockQuestions: TriviaQuestion[] = [
  { id: '1', textEn: 'What is the capital of France?', textIt: 'Qual è la capitale della Francia?', answerEn: 'Paris', answerIt: 'Parigi', categoryId: 'geography', difficulty: 'easy' },
  { id: '2', textEn: 'Who painted the Mona Lisa?', textIt: 'Chi ha dipinto la Monna Lisa?', answerEn: 'Leonardo da Vinci', answerIt: 'Leonardo da Vinci', categoryId: 'art', difficulty: 'easy' },
  { id: '3', textEn: 'What is the chemical symbol for water?', textIt: "Qual è il simbolo chimico dell'acqua?", answerEn: 'H2O', answerIt: 'H2O', categoryId: 'science', difficulty: 'easy' },
  { id: '4', textEn: 'What planet is known as the Red Planet?', textIt: 'Quale pianeta è conosciuto come il Pianeta Rosso?', answerEn: 'Mars', answerIt: 'Marte', categoryId: 'astronomy', difficulty: 'easy' },
  { id: '5', textEn: 'Who wrote "Romeo and Juliet"?', textIt: 'Chi ha scritto "Romeo e Giulietta"?', answerEn: 'William Shakespeare', answerIt: 'William Shakespeare', categoryId: 'literature', difficulty: 'easy' }
];

const QUESTION_TIMER = 90; // seconds

// ─────────────────────────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────────────────────────
export const useTriviaGame = () => {
  const { state, dispatch } = useGame();

  // ╭────────────────────────────────────────────────────╮
  // │ Local round-state (each tab)                      │
  // ╰────────────────────────────────────────────────────╯
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

  // ╭────────────────────────────────────────────────────╮
  // │ Narrator-side timer                               │
  // ╰────────────────────────────────────────────────────╯
  useEffect(() => {
    if (!isNarrator) return;
    const t = setInterval(() => {
      setCurrentRound(prev => ({ ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) }));
    }, 1000);
    return () => clearInterval(t);
  }, [isNarrator]);

  // ╭────────────────────────────────────────────────────╮
  // │ PLAYER presses the buzzer → insert row             │
  // ╰────────────────────────────────────────────────────╯
  const handlePlayerBuzzer = useCallback(async () => {
    if (!state.currentPlayer || isNarrator || hasPlayerAnswered || !state.gameId) return;

    window.myBuzzer ? window.myBuzzer.play().catch(() => playAudio('buzzer')) : playAudio('buzzer');

    const questionId = currentRound.questions[currentRound.currentQuestionIndex].id;

    await supabase
      .from('player_answers')
      .insert({ game_id: state.gameId, question_id: questionId, player_id: state.currentPlayer.id })
      .single()
      .catch(err => console.error('[handlePlayerBuzzer] insert error', err.message));

    // optimistic UI
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

  // ╭────────────────────────────────────────────────────╮
  // │ Open shared Supabase channel (once per session)    │
  // ╰────────────────────────────────────────────────────╯
  useEffect(() => {
    if (!state.gameId) return;

    if (!gameChannel) {
      gameChannel = supabase.channel(`game-${state.gameId}`).subscribe();
      console.log('[Realtime] opened channel', gameChannel.topic);
    }
  }, [state.gameId]);

  // ╭────────────────────────────────────────────────────╮
  // │ Narrator listens for new buzzer INSERTs            │
  // ╰────────────────────────────────────────────────────╯
  useEffect(() => {
    if (!isNarrator) return;
    if (!state.gameId) return;

    const dbChannel = supabase
      .channel('player_answers_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'player_answers' },
        payload => {
          const { player_id, game_id, question_id, created_at } = payload.new as any;

          if (game_id !== state.gameId) return; // other games
          const currentQ = currentRound.questions[currentRound.currentQuestionIndex].id;
          if (question_id !== currentQ) return; // other questions

          console.log('[Narrator] Realtime payload →', payload);

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
              ].sort((a, b) => a.timestamp - b.timestamp)
            };
          });
          setShowPendingAnswers(true);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(dbChannel);
  }, [isNarrator, state.gameId, currentRound.currentQuestionIndex, state.players]);

  // ╭────────────────────────────────────────────────────╮
  // │  Receive NEXT_QUESTION broadcast (all tabs)        │
  // ╰────────────────────────────────────────────────────╯
  useEffect(() => {
    if (!state.gameId) return;
    if (!gameChannel) return;

    const sub = gameChannel.on('broadcast', { event: 'NEXT_QUESTION' }, ({ payload }) => {
      const { questionIndex, scores } = payload as any;

      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: questionIndex,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      }));

      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);

      // update scores
      scores.forEach((s: { id: string; score: number }) => {
        dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
      });
    });

    return () => { gameChannel?.off('broadcast', { event: 'NEXT_QUESTION' }, sub); };
  }, [state.gameId, dispatch]);

  // ╭────────────────────────────────────────────────────╮
  // │  Correct answer                                    │
  // ╰────────────────────────────────────────────────────╯
  const handleCorrectAnswer = useCallback((playerId: string) => {
    // 1. update score locally and in context
    const newScore = (state.players.find(p => p.id === playerId)?.score || 0) + 10;
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });

    // 2. advance question locally
    setCurrentRound(prev => {
      const nextIdx = Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1);
      return { ...prev, currentQuestionIndex: nextIdx, playerAnswers: [], timeLeft: QUESTION_TIMER };
    });

    // 3. broadcast to everyone
    if (gameChannel) {
      const scores = state.players.map(p =>
        p.id === playerId ? { id: p.id, score: newScore } : { id: p.id, score: p.score || 0 }
      );
      gameChannel.send({
        type: 'broadcast',
        event: 'NEXT_QUESTION',
        payload: {
          questionIndex: currentRound.currentQuestionIndex + 1,
          scores
        }
      });
    }

    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
    playAudio('success');
  }, [state.players, dispatch, currentRound.currentQuestionIndex]);

  // ╭────────────────────────────────────────────────────╮
  // │  Wrong answer                                      │
  // ╰────────────────────────────────────────────────────╯
  const handleWrongAnswer = useCallback((playerId: string) => {
    const newScore = Math.max(0, (state.players.find(p => p.id === playerId)?.score || 0) - 5);
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });

    setCurrentRound(prev => {
      const remaining = prev.playerAnswers.filter(a => a.playerId !== playerId);
      if (remaining.length === 0) {
        const nextIdx = Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1);

        // broadcast skip
        if (gameChannel) {
          const scores = state.players.map(p =>
            p.id === playerId ? { id: p.id, score: newScore } : { id: p.id, score: p.score || 0 }
          );
          gameChannel.send({
            type: 'broadcast',
            event: 'NEXT_QUESTION',
            payload: { questionIndex: nextIdx, scores }
          });
        }

        setAnsweredPlayers(new Set());
        setShowPendingAnswers(false);
        playAudio('notification');
        return { ...prev, currentQuestionIndex: nextIdx, playerAnswers: [], timeLeft: QUESTION_TIMER };
      }
      return { ...prev, playerAnswers: remaining };
    });

    playAudio('error');
  }, [state.players, dispatch]);

  // ╭────────────────────────────────────────────────────╮
  // │  Manual next question (narrator button)            │
  // ╰────────────────────────────────────────────────────╯
  const handleNextQuestion = useCallback(() => {
    setCurrentRound(prev => {
      const nextIdx = Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1);

      // broadcast
      if (gameChannel) {
        const scores = state.players.map(p => ({ id: p.id, score: p.score || 0 }));
        gameChannel.send({
          type: 'broadcast',
          event: 'NEXT_QUESTION',
          payload: { questionIndex: nextIdx, scores }
        });
      }

      return { ...prev, currentQuestionIndex: nextIdx, playerAnswers: [], timeLeft: QUESTION_TIMER };
    });

    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
    playAudio('notification');
  }, [state.players]);

  // ╭────────────────────────────────────────────────────╮
  // │  Exported API                                      │
  // ╰────────────────────────────────────────────────────╯
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
