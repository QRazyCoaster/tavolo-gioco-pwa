import { useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import {
  CORRECT_ANSWER_POINTS,
  WRONG_ANSWER_POINTS,
  MIN_SCORE_LIMIT
} from '@/utils/triviaConstants';
import {
  broadcastNextQuestion,
  broadcastRoundEnd,
  broadcastScoreUpdate
} from '@/utils/triviaBroadcast';
import { Round } from '@/types/trivia';

export const useNarratorActions = (
  roundNumber: number,
  currentQuestionIndex: number,
  getNextNarrator: () => { nextNarratorId: string; isGameOver: boolean },
  advanceQuestionLocally: (idx: number) => void,
  setNextNarrator: (id: string) => void,
  setShowRoundBridge: (show: boolean) => void,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setGameOver?: (over: boolean) => void
) => {
  const { state, dispatch } = useGame();

  /* helper: update score and return fresh players array */
  const applyDelta = (playerId: string, delta: number) => {
    const updated = state.players.map(p =>
      p.id === playerId
        ? { ...p, score: Math.max(MIN_SCORE_LIMIT, (p.score || 0) + delta) }
        : p
    );
    const p = updated.find(p => p.id === playerId)!;
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: p.score } });
    return updated;
  };

  /* ───────────── correct answer ───────────── */
  const handleCorrectAnswer = useCallback(
    (playerId: string) => {
      playAudio('success');
      const freshPlayers = applyDelta(playerId, CORRECT_ANSWER_POINTS);

      /* sync everyone’s score immediately */
      broadcastScoreUpdate(freshPlayers);

      const totalQs = 7; // QUESTIONS_PER_ROUND
      const isLast  = currentQuestionIndex >= totalQs - 1;

      if (!isLast) {
        const nextIdx = currentQuestionIndex + 1;
        advanceQuestionLocally(nextIdx);            // ← instant local update
        broadcastNextQuestion(nextIdx, freshPlayers);
        return;
      }

      /* end-of-round */
      const { nextNarratorId, isGameOver } = getNextNarrator();
      setNextNarrator(nextNarratorId);
      broadcastRoundEnd(roundNumber, nextNarratorId, freshPlayers, isGameOver);
      setShowRoundBridge(true);
      if (isGameOver && setGameOver) {
        setTimeout(() => setGameOver(true), 6500);
      }
    },
    [
      state.players,
      currentQuestionIndex,
      roundNumber,
      getNextNarrator,
      advanceQuestionLocally,
      setNextNarrator,
      setShowRoundBridge,
      setGameOver
    ]
  );

  /* ───────────── wrong answer ───────────── */
  const handleWrongAnswer = useCallback(
    (playerId: string) => {
      playAudio('error');
      const freshPlayers = applyDelta(playerId, WRONG_ANSWER_POINTS);
      broadcastScoreUpdate(freshPlayers);
    },
    [state.players]
  );

  /* ───────────── manual “Next” / timer up ───────────── */
  const goToNextQuestion = () => {
    const totalQs = 7;
    const isLast  = currentQuestionIndex >= totalQs - 1;

    if (!isLast) {
      const idx = currentQuestionIndex + 1;
      advanceQuestionLocally(idx);
      broadcastNextQuestion(idx, state.players);
      return;
    }

    const { nextNarratorId, isGameOver } = getNextNarrator();
    setNextNarrator(nextNarratorId);
    broadcastRoundEnd(roundNumber, nextNarratorId, state.players, isGameOver);
    setShowRoundBridge(true);
    if (isGameOver && setGameOver) {
      setTimeout(() => setGameOver(true), 6500);
    }
  };

  const handleNextQuestion = useCallback(goToNextQuestion, [
    currentQuestionIndex,
    roundNumber,
    state.players
  ]);

  const handleTimeUp = useCallback(() => {
    playAudio('error');
    goToNextQuestion();
  }, [goToNextQuestion]);

  return {
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion,
    handleTimeUp
  };
};
