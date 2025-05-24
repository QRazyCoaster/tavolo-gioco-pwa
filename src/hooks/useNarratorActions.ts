// src/hooks/useNarratorActions.ts
import { useCallback } from 'react';
import { useGame, Player } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import {
  broadcastScoreUpdate,
  broadcastNextQuestion,
  broadcastRoundEnd
} from '@/utils/triviaBroadcast';
import {
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND,
  CORRECT_ANSWER_POINTS,
  WRONG_ANSWER_POINTS,
  MIN_SCORE_LIMIT
} from '@/utils/triviaConstants';

export const useNarratorActions = (
  currentRoundNumber: number,
  currentQuestionIndex: number,
  getNextNarrator: () => string,
  advanceQuestionLocally: (nextIndex: number) => void,
  setNextNarrator: React.Dispatch<React.SetStateAction<string>>,
  setShowRoundBridge: React.Dispatch<React.SetStateAction<boolean>>,
  setNextRoundNumber: React.Dispatch<React.SetStateAction<number>>,
  setCurrentRound: React.Dispatch<React.SetStateAction<any>>,
  setGameOver:   React.Dispatch<React.SetStateAction<boolean>>,   // NEW
  players: Player[]
) => {
  const { state, dispatch } = useGame();

  /* ───────── helpers ───────── */
  const withUpdatedScores = (playerId: string, delta: number) => {
    const current = state.players.find(p => p.id === playerId)?.score || 0;
    const newScore = Math.max(MIN_SCORE_LIMIT, current + delta);
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });
    return state.players.map(p => (p.id === playerId ? { ...p, score: newScore } : p));
  };

  /* ───────── core sender ───────── */
  const sendRoundEnd = (
    lastRound: boolean,
    nextNarratorId: string,
    allPlayers: Player[]
  ) => {
    if (lastRound) {
      broadcastRoundEnd(currentRoundNumber, '', allPlayers, true);
      setGameOver(true);            // narrator stops immediately
    } else {
      setNextRoundNumber(currentRoundNumber + 1);
      broadcastRoundEnd(currentRoundNumber, nextNarratorId, allPlayers);
      setNextNarrator(nextNarratorId);
      setShowRoundBridge(true);
    }
  };

  /* ───────── Correct answer ───────── */
  const handleCorrectAnswer = useCallback((playerId: string) => {
    const updated = withUpdatedScores(playerId, CORRECT_ANSWER_POINTS);
    const isLastQ  = currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
    const lastRound = currentRoundNumber >= players.length;

    if (isLastQ) {
      const nextId = getNextNarrator();
      sendRoundEnd(lastRound, nextId, updated);
      playAudio('success');
    } else {
      const nxt = currentQuestionIndex + 1;
      advanceQuestionLocally(nxt);
      broadcastNextQuestion(nxt, updated);
      playAudio('success');
    }
    broadcastScoreUpdate(updated);
  }, [
    currentQuestionIndex,
    currentRoundNumber,
    players.length,
    advanceQuestionLocally,
    getNextNarrator
  ]);

  /* ───────── Wrong answer ───────── */
  const handleWrongAnswer = useCallback((playerId: string) => {
    const updated = withUpdatedScores(playerId, WRONG_ANSWER_POINTS);

    setCurrentRound(prev => {
      const remain = prev.playerAnswers.filter(a => a.playerId !== playerId);
      if (remain.length === 0) {
        const isLastQ = prev.currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
        const lastRound = currentRoundNumber >= players.length;

        if (isLastQ) {
          const nextId = getNextNarrator();
          sendRoundEnd(lastRound, nextId, updated);
          playAudio('notification');
        } else {
          const nxt = prev.currentQuestionIndex + 1;
          advanceQuestionLocally(nxt);
          broadcastNextQuestion(nxt, updated);
          playAudio('notification');
          return { ...prev, currentQuestionIndex: nxt, playerAnswers: [], timeLeft: QUESTION_TIMER };
        }
      }
      return { ...prev, playerAnswers: remain };
    });

    broadcastScoreUpdate(updated);
    playAudio('error');
  }, [
    currentRoundNumber,
    players.length,
    getNextNarrator,
    advanceQuestionLocally,
    setCurrentRound
  ]);

  /* ───────── Manual next / time-up share same idea ───────── */
  const goNextManually = (isTimeUp = false) => {
    const isLastQ = currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
    const lastRound = currentRoundNumber >= players.length;

    if (isLastQ) {
      const nextId = getNextNarrator();
      sendRoundEnd(lastRound, nextId, state.players);
    } else {
      const nxt = currentQuestionIndex + 1;
      advanceQuestionLocally(nxt);
      broadcastNextQuestion(nxt, state.players);
    }
    playAudio(isTimeUp ? 'notification' : 'notification');
  };

  return {
    handleCorrectAnswer,
    handleWrongAnswer,
    handleNextQuestion: () => goNextManually(false),
    handleTimeUp:       () => goNextManually(true)
  };
};
