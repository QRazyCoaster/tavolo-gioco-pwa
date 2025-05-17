import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { TriviaQuestion, PlayerAnswer, Round } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import { supabase } from '@/supabaseClient';

// -----------------------------------------------------------------------------
//  Demo questions (replace with Supabase-fetch later)
// -----------------------------------------------------------------------------
const mockQuestions: TriviaQuestion[] = [
  {
    id: '1',
    textEn: 'What is the capital of France?',
    textIt: 'Qual è la capitale della Francia?',
    answerEn: 'Paris',
    answerIt: 'Parigi',
    categoryId: 'geography',
    difficulty: 'easy'
  },
  {
    id: '2',
    textEn: 'Who painted the Mona Lisa?',
    textIt: 'Chi ha dipinto la Monna Lisa?',
    answerEn: 'Leonardo da Vinci',
    answerIt: 'Leonardo da Vinci',
    categoryId: 'art',
    difficulty: 'easy'
  },
  {
    id: '3',
    textEn: 'What is the chemical symbol for water?',
    textIt: "Qual è il simbolo chimico dell'acqua?",
    answerEn: 'H2O',
    answerIt: 'H2O',
    categoryId: 'science',
    difficulty: 'easy'
  },
  {
    id: '4',
    textEn: 'What planet is known as the Red Planet?',
    textIt: 'Quale pianeta è conosciuto come il Pianeta Rosso?',
    answerEn: 'Mars',
    answerIt: 'Marte',
    categoryId: 'astronomy',
    difficulty: 'easy'
  },
  {
    id: '5',
    textEn: 'Who wrote "Romeo and Juliet"?',
    textIt: 'Chi ha scritto "Romeo e Giulietta"?',
    answerEn: 'William Shakespeare',
    answerIt: 'William Shakespeare',
    categoryId: 'literature',
    difficulty: 'easy'
  }
];

const QUESTION_TIMER = 90; // seconds

// -----------------------------------------------------------------------------
//  Main hook
// -----------------------------------------------------------------------------
export const useTriviaGame = () => {
  const { state, dispatch } = useGame();
  const { toast } = useToast();

  // ────────────────────────────────────────────────────────────────────────────
  //  Local round‑state (lives in every tab) – synced via Supabase Realtime
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

  const isNarrator = state.currentPlayer?.id === currentRound.narratorId;
  const hasPlayerAnswered = state.currentPlayer ? answeredPlayers.has(state.currentPlayer.id) : false;

  // ---------------------------------------------------------------------------
  //  ⏲️  Narrator‑side timer
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isNarrator) return;

    const t = setInterval(() => {
      setCurrentRound(prev => ({ ...prev, timeLeft: Math.max(0, prev.timeLeft - 1) }));
    }, 1_000);
    return () => clearInterval(t);
  }, [isNarrator]);

  // ---------------------------------------------------------------------------
  //  🔔  PLAYER: press the buzzer → insert row in player_answers table
  // ---------------------------------------------------------------------------
  const handlePlayerBuzzer = useCallback(async () => {
    if (!state.currentPlayer || isNarrator || hasPlayerAnswered || !state.gameId) return;

    // Play local sound immediately so the player gets feedback
    if (window.myBuzzer) {
      window.myBuzzer.play().catch(() => playAudio('buzzer'));
    } else {
      playAudio('buzzer');
    }

    const questionId = currentRound.questions[currentRound.currentQuestionIndex].id;

    // Fire‑and‑forget insert – duplicates are ignored by the unique index
    const { error } = await supabase
      .from('player_answers')
      .insert({ game_id: state.gameId, question_id: questionId, player_id: state.currentPlayer.id })
      .single();
    if (error && error.code !== '23505') {
      console.error('[handlePlayerBuzzer] Supabase insert error', error);
    }

    // Optimistic local update so the player sees themselves in queue right away
    const newAnswer: PlayerAnswer = {
      playerId: state.currentPlayer.id,
      playerName: state.currentPlayer.name,
      timestamp: Date.now()
    };
    setCurrentRound(prev => {
      if (prev.playerAnswers.some(a => a.playerId === newAnswer.playerId)) return prev;
      return { ...prev, playerAnswers: [...prev.playerAnswers, newAnswer] };
    });
    setAnsweredPlayers(prev => new Set(prev).add(state.currentPlayer!.id));
    setShowPendingAnswers(true);
  }, [state.currentPlayer, state.gameId, isNarrator, hasPlayerAnswered, currentRound]);

// ----------------------------------------------------------
//  NARRATOR: subscribe to every INSERT, filter in handler
// ----------------------------------------------------------
useEffect(() => {
  if (!isNarrator || !state.gameId) return;

  const channel = supabase
    .channel(`buzz-${state.gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'player_answers',
        filter: `game_id=eq.${state.gameId}`   // ← only ONE filter here
      },
      payload => {
        const { player_id, question_id, created_at } = payload.new;

        // Ignore rows for other questions
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
            ].sort((a, b) => a.timestamp - b.timestamp)
          };
        });
        setShowPendingAnswers(true);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [isNarrator, state.gameId, currentRound.currentQuestionIndex, state.players]);


  // ---------------------------------------------------------------------------
  //  ✅ Correct answer  (logic unchanged)
  // ---------------------------------------------------------------------------
  const handleCorrectAnswer = useCallback(
    (playerId: string) => {
      dispatch({
        type: 'UPDATE_SCORE',
        payload: {
          playerId,
          score: (state.players.find(p => p.id === playerId)?.score || 0) + 10
        }
      });

      setCurrentRound(prev => {
        const isLast = prev.currentQuestionIndex >= prev.questions.length - 1;
        return {
          ...prev,
          currentQuestionIndex: isLast ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
          playerAnswers: [],
          timeLeft: QUESTION_TIMER
        };
      });

      setAnsweredPlayers(new Set());
      setShowPendingAnswers(false);
      playAudio('success');
    },
    [state.players, dispatch]
  );

  // ---------------------------------------------------------------------------
  //  ❌ Wrong answer  (auto‑advance if nobody left)
  // ---------------------------------------------------------------------------
  const handleWrongAnswer = useCallback(
    (playerId: string) => {
      dispatch({
        type: 'UPDATE_SCORE',
        payload: {
          playerId,
          score: Math.max(0, (state.players.find(p => p.id === playerId)?.score || 0) - 5)
        }
      });

      setCurrentRound(prev => {
        const remaining = prev.playerAnswers.filter(a => a.playerId !== playerId);
        if (remaining.length === 0) {
          // nobody left → next question
          const isLast = prev.currentQuestionIndex >= prev.questions.length - 1;
          playAudio('notification');
          setAnsweredPlayers(new Set());
          setShowPendingAnswers(false);
          return {
            ...prev,
            currentQuestionIndex: isLast ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
            playerAnswers: [],
            timeLeft: QUESTION_TIMER
          };
        }
        return { ...prev, playerAnswers: remaining };
      });
      playAudio('error');
    },
    [state.players, dispatch]
  );

  // ---------------------------------------------------------------------------
  //  ▶️  Manual next question (narrator button)
  // ---------------------------------------------------------------------------
  const handleNextQuestion = useCallback(() => {
    setCurrentRound(prev => {
      const isLast = prev.currentQuestionIndex >= prev.questions.length - 1;
      return {
        ...prev,
        currentQuestionIndex: isLast ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
        playerAnswers: [],
        timeLeft: QUESTION_TIMER
      };
    });
    setAnsweredPlayers(new Set());
    setShowPendingAnswers(false);
    playAudio('notification');
  }, []);

  // ---------------------------------------------------------------------------
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
