import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { TriviaQuestion, PlayerAnswer, Round } from '@/types/trivia';
import { playAudio } from '@/utils/audioUtils';
import { supabase } from '@/supabaseClient';

// -----------------------------------------------------------------------------
//  Demo questions (replace with Supabase-fetch later)
// -----------------------------------------------------------------------------
const mockQuestions: TriviaQuestion[] = [
  { id: '1', textEn: 'What is the capital of France?', textIt: 'Qual è la capitale della Francia?', answerEn: 'Paris', answerIt: 'Parigi', categoryId: 'geography', difficulty: 'easy' },
  { id: '2', textEn: 'Who painted the Mona Lisa?', textIt: 'Chi ha dipinto la Monna Lisa?', answerEn: 'Leonardo da Vinci', answerIt: 'Leonardo da Vinci', categoryId: 'art', difficulty: 'easy' },
  { id: '3', textEn: 'What is the chemical symbol for water?', textIt: "Qual è il simbolo chimico dell'acqua?", answerEn: 'H2O', answerIt: 'H2O', categoryId: 'science', difficulty: 'easy' },
  { id: '4', textEn: 'What planet is known as the Red Planet?', textIt: 'Quale pianeta è conosciuto come il Pianeta Rosso?', answerEn: 'Mars', answerIt: 'Marte', categoryId: 'astronomy', difficulty: 'easy' },
  { id: '5', textEn: 'Who wrote "Romeo and Juliet"?', textIt: 'Chi ha scritto "Romeo e Giulietta"?', answerEn: 'William Shakespeare', answerIt: 'William Shakespeare', categoryId: 'literature', difficulty: 'easy' }
];

const QUESTION_TIMER = 90; // seconds

// -----------------------------------------------------------------------------
//  Main hook
// -----------------------------------------------------------------------------
export const useTriviaGame = () => {
  const { state, dispatch } = useGame();

  // ────────────────────────────────────────────────────────────────────────────
  //  Local round-state (lives in every tab) – synced via Supabase Realtime
  // ────────────────────────────────────────────────────────────────────────────
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

  const isNarrator       = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = state.currentPlayer ? answeredPlayers.has(state.currentPlayer.id) : false;

  // ---------------------------------------------------------------------------
  //  ⏲️  Narrator-side timer
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isNarrator) return;
    const t = setInterval(() => {
      setCurrentRound(prev => ({ ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) }));
    }, 1000);
    return () => clearInterval(t);
  }, [isNarrator]);

  // ---------------------------------------------------------------------------
  //  🔔  PLAYER: press the buzzer → insert player_answers row
  // ---------------------------------------------------------------------------
  const handlePlayerBuzzer = useCallback(async () => {
    if (!state.currentPlayer || isNarrator || hasPlayerAnswered || !state.gameId) return;

    window.myBuzzer ? window.myBuzzer.play().catch(() => playAudio('buzzer')) : playAudio('buzzer');

    const questionId = currentRound.questions[currentRound.currentQuestionIndex].id;

    await supabase
      .from('player_answers')
      .insert({ game_id: state.gameId, question_id: questionId, player_id: state.currentPlayer.id })
      .single()
      .catch(e => console.error('[handlePlayerBuzzer] insert error', e.message));

    const optimistic: PlayerAnswer = {
      playerId: state.currentPlayer.id,
      playerName: state.currentPlayer.name,
      timestamp: Date.now()
    };

    setCurrentRound(prev => (
      prev.playerAnswers.some(a => a.playerId === optimistic.playerId)
        ? prev
        : { ...prev, playerAnswers: [...prev.playerAnswers, optimistic] }
    ));
    setAnsweredPlayers(prev => new Set(prev).add(state.currentPlayer!.id));
    setShowPendingAnswers(true);
  }, [state.currentPlayer, state.gameId, isNarrator, hasPlayerAnswered, currentRound]);

  // ---------------------------------------------------------------------------
  //  📡  NARRATOR listens for Realtime INSERTs (no filter → always logs)
// ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isNarrator) return;

    console.log('[Narrator] Subscribing to player_answers inserts …');

    const channel = supabase
      .channel('player_answers_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'player_answers' },
        payload => {
          console.log('[Narrator] Realtime payload →', payload);

          const { player_id, game_id, question_id, created_at } = payload.new as any;

          if (game_id !== state.gameId) return; // ignore other games

          const currentQ = currentRound.questions[currentRound.currentQuestionIndex].id;
          if (question_id !== currentQ) return; // ignore other questions

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

    return () => { supabase.removeChannel(channel); };
  }, [isNarrator, state.gameId, currentRound.currentQuestionIndex, state.players]);

  // ---------------------------------------------------------------------------
  //  ✅  Correct answer
  // ---------------------------------------------------------------------------
  const handleCorrectAnswer = useCallback((playerId: string) => {
    dispatch({
      type: 'UPDATE_SCORE',
      payload: { playerId, score: (state.players.find(p => p.id === playerId)?.score || 0) + 10 }
    });

    setCurrentRound(prev => {
      const last = prev.currentQuestionIndex >= prev.questions.length - 1;
      return {
        ...prev,
        currentQuestionIndex: last ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      };
    });

    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
    playAudio('success');
  }, [state.players, dispatch]);

  // ---------------------------------------------------------------------------
  //  ❌  Wrong answer
  // ---------------------------------------------------------------------------
  const handleWrongAnswer = useCallback((playerId: string) => {
    dispatch({
      type: 'UPDATE_SCORE',
      payload: { playerId, score: Math.max(0, (state.players.find(p => p.id === playerId)?.score || 0) - 5) }
    });

    setCurrentRound(prev => {
      const remaining = prev.playerAnswers.filter(a => a.playerId !== playerId);
      if (remaining.length === 0) {
        const last = prev.currentQuestionIndex >= prev.questions.length - 1;
        setAnsweredPlayers(new Set());
        setShowPendingAnswers(false);
        playAudio('notification');
        return {
          ...prev,
          currentQuestionIndex: last ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
          playerAnswers: [],
          timeLeft: QUESTION_TIMER
        };
      }
