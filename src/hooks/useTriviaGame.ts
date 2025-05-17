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
//  Demo questions
// ─────────────────────────────────────────────────────────────
const mockQuestions: TriviaQuestion[] = [
  { id: '1', textEn: 'What is the capital of France?', textIt: 'Qual è la capitale della Francia?', answerEn: 'Paris', answerIt: 'Parigi', categoryId: 'geography', difficulty: 'easy' },
  { id: '2', textEn: 'Who painted the Mona Lisa?', textIt: 'Chi ha dipinto la Monna Lisa?', answerEn: 'Leonardo da Vinci', answerIt: 'Leonardo da Vinci', categoryId: 'art', difficulty: 'easy' },
  { id: '3', textEn: 'What is the chemical symbol for water?', textIt: "Qual è il simbolo chimico dell'acqua?", answerEn: 'H2O', answerIt: 'H2O', categoryId: 'science', difficulty: 'easy' },
  { id: '4', textEn: 'What planet is known as the Red Planet?', textIt: 'Quale pianeta è conosciuto come il Pianeta Rosso?', answerEn: 'Mars', answerIt: 'Marte', categoryId: 'astronomy', difficulty: 'easy' },
  { id: '5', textEn: 'Who wrote "Romeo and Juliet"?', textIt: 'Chi ha scritto "Romeo e Giulietta"?', answerEn: 'William Shakespeare', answerIt: 'William Shakespeare', categoryId: 'literature', difficulty: 'easy' }
// after the Shakespeare question …
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
  textIt: 'Quale gas assorbono le piante dall’atmosfera?',
  answerEn: 'Carbon dioxide',
  answerIt: 'Anidride carbonica',
  categoryId: 'science',
  difficulty: 'easy'
},
…

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
      setCurrentRound(prev => ({ ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) }));
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

      if (error && error.code !== '23505') {
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
  //  Open shared channel once
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.gameId && !gameChannel) {
      gameChannel = supabase.channel(`game-${state.gameId}`).subscribe();
    }
  }, [state.gameId]);

  // ────────────────────────────────────────────────────────────
  //  Narrator listens for buzzer INSERTs
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

    return () => { void supabase.removeChannel(dbChannel); };
  }, [isNarrator, state.gameId, currentRound.currentQuestionIndex, state.players]);

  // ────────────────────────────────────────────────────────────
  //  Listen for NEXT_QUESTION broadcasts
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.gameId || !gameChannel) return;

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

      scores.forEach((s: { id: string; score: number }) => {
        dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } });
      });
    });

    return () => { void sub; };        // no off()/unsubscribe needed
  }, [state.gameId, dispatch]);

  // helpers ───────────────────────────────────────────────────
  const broadcastNextQuestion = (
    nextIndex: number,
    scores?: { id: string; score: number }[]
  ) => {
    if (!gameChannel) return;
    const payloadScores =
      scores ?? state.players.map(p => ({ id: p.id, score: p.score || 0 }));

    console.log('[useTriviaGame] Broadcasting score update to all clients:', payloadScores);

    gameChannel.send({
      type: 'broadcast',
      event: 'NEXT_QUESTION',
      payload: { questionIndex: nextIndex, scores: payloadScores }
    });
  };

  const advanceQuestionLocally = (nextIndex: number) => {
    setCurrentRound(prev => ({
      ...prev,
      currentQuestionIndex: nextIndex,
      playerAnswers: [],
      timeLeft: QUESTION_TIMER
    }));
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
  };

  // ────────────────────────────────────────────────────────────
  //  Correct answer
  // ────────────────────────────────────────────────────────────
  const handleCorrectAnswer = useCallback((playerId: string) => {
    const newScore = (state.players.find(p => p.id === playerId)?.score || 0) + 10;
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });

    const nextIdx = Math.min(currentRound.currentQuestionIndex + 1, currentRound.questions.length - 1);
    advanceQuestionLocally(nextIdx);

    // build fresh score array **including** the new score
    const updatedScores = state.players.map(p =>
      p.id === playerId ? { id: p.id, score: newScore } : { id: p.id, score: p.score || 0 }
    );
    broadcastNextQuestion(nextIdx, updatedScores);

    playAudio('success');
  }, [state.players, dispatch, currentRound.currentQuestionIndex, currentRound.questions.length]);

  // ────────────────────────────────────────────────────────────
  //  Wrong answer
  // ────────────────────────────────────────────────────────────
  const handleWrongAnswer = useCallback((playerId: string) => {
const newScore = (state.players.find(p => p.id === playerId)?.score || 0) - 5; // ← no clamping
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });

    setCurrentRound(prev => {
      const remaining = prev.playerAnswers.filter(a => a.playerId !== playerId);
      if (remaining.length === 0) {
        const nextIdx = Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1);
        advanceQuestionLocally(nextIdx);

        const updatedScores = state.players.map(p =>
          p.id === playerId ? { id: p.id, score: newScore } : { id: p.id, score: p.score || 0 }
        );
        broadcastNextQuestion(nextIdx, updatedScores);
        playAudio('notification');
        return { ...prev, currentQuestionIndex: nextIdx, playerAnswers: [], timeLeft: QUESTION_TIMER };
      }
      return { ...prev, playerAnswers: remaining };
    });

    playAudio('error');
  }, [state.players, dispatch]);

  // ────────────────────────────────────────────────────────────
  //  Manual next question
  // ────────────────────────────────────────────────────────────
  const handleNextQuestion = useCallback(() => {
    const nextIdx = Math.min(currentRound.currentQuestionIndex + 1, currentRound.questions.length - 1);
    advanceQuestionLocally(nextIdx);
    broadcastNextQuestion(nextIdx);
    playAudio('notification');
  }, [currentRound.currentQuestionIndex, currentRound.questions.length]);

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
