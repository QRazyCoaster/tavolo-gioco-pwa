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
  players: Player                                   // ← NEW parameter
) => {
  const { state, dispatch } = useGame();

  // ───────────────────────────────────────────────────────────
  //  Helpers
  // ───────────────────────────────────────────────────────────
  const withUpdatedScores = (playerId: string, delta: number) => {
    const current = state.players.find(p => p.id === playerId)?.score || 0;
    const newScore = Math.max(MIN_SCORE_LIMIT, current + delta);
    dispatch({ type: 'UPDATE_SCORE', payload: { playerId, score: newScore } });
    return state.players.map(p =>
      p.id === playerId ? { ...p, score: newScore } : p
    );
  };

  // ───────────────────────────────────────────────────────────
  //  Correct answer
  // ───────────────────────────────────────────────────────────
  const handleCorrectAnswer = useCallback(
    (playerId: string) => {
     console.log('[useNarratorActions] round=', currentRoundNumber,
                'players=', players.length);
      const updatedPlayers = withUpdatedScores(playerId, CORRECT_ANSWER_POINTS);
      const isLast = currentQuestionIndex === QUESTIONS_PER_ROUND - 1;

      if (isLast) {
        // FINAL vs NEXT‐ROUND logic
        if (currentRoundNumber >= players.length) {
          // FINAL ROUND → end game
          broadcastRoundEnd(currentRoundNumber, '', updatedPlayers, true);
          setShowRoundBridge(true);
        } else {
          // NEXT ROUND
          const nextNarratorId = getNextNarrator();
          setNextRoundNumber(currentRoundNumber + 1);
          broadcastRoundEnd(currentRoundNumber, nextNarratorId, updatedPlayers);
          setShowRoundBridge(true);
          setNextNarrator(nextNarratorId);
        }
        playAudio('success');
      } else {
        const nextIdx = currentQuestionIndex + 1;
        advanceQuestionLocally(nextIdx);
        broadcastNextQuestion(nextIdx, updatedPlayers);
        playAudio('success');
      }

      broadcastScoreUpdate(updatedPlayers);
    },
    [
      currentQuestionIndex,
      currentRoundNumber,
      advanceQuestionLocally,
      getNextNarrator,
      setNextNarrator,
      setShowRoundBridge,
      setNextRoundNumber,    // ← added
      players,               // ← added
      state.players
    ]
  );

  // ───────────────────────────────────────────────────────────
  //  Wrong answer
  // ───────────────────────────────────────────────────────────
  const handleWrongAnswer = useCallback(
    (playerId: string) => {
      console.log('[useNarratorActions] round=', currentRoundNumber,
                'players=', players.length);
      const updatedPlayers = withUpdatedScores(playerId, WRONG_ANSWER_POINTS);

      setCurrentRound(prev => {
        const remaining = prev.playerAnswers.filter(a => a.playerId !== playerId);
        if (remaining.length === 0) {
          const isLast = prev.currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
          if (isLast) {
            if (currentRoundNumber >= players.length) {
              // FINAL ROUND → end game
              broadcastRoundEnd(currentRoundNumber, '', updatedPlayers, true);
              setShowRoundBridge(true);
            } else {
              // NEXT ROUND
              const nextNarratorId = getNextNarrator();
              setNextRoundNumber(currentRoundNumber + 1);
              broadcastRoundEnd(currentRoundNumber, nextNarratorId, updatedPlayers);
              setShowRoundBridge(true);
              setNextNarrator(nextNarratorId);
            }
            playAudio('notification');
          } else {
            // Same round → next question
            const nextIdx = prev.currentQuestionIndex + 1;
            advanceQuestionLocally(nextIdx);
            broadcastNextQuestion(nextIdx, updatedPlayers);
            playAudio('notification');
            return {
              ...prev,
              currentQuestionIndex: nextIdx,
              playerAnswers: [],
              timeLeft: QUESTION_TIMER
            };
          }
        }
        return { ...prev, playerAnswers: remaining };
      });

      broadcastScoreUpdate(updatedPlayers);
      playAudio('error');
    },
    [
      currentRoundNumber,
      getNextNarrator,
      advanceQuestionLocally,
      setNextNarrator,
      setShowRoundBridge,
      setNextRoundNumber,    // ← added
      setCurrentRound,
      players,               // ← added
      state.players
    ]
  );

  // ───────────────────────────────────────────────────────────
  //  Manual “Next Question” (last‐question case)
  // ───────────────────────────────────────────────────────────
  const handleNextQuestion = useCallback(() => {
   console.log('[useNarratorActions] round=', currentRoundNumber,
                'players=', players.length);
    const isLast = currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
    if (isLast) {
      if (currentRoundNumber >= players.length) {
        // FINAL ROUND → end game
        broadcastRoundEnd(currentRoundNumber, '', state.players, true);
        setShowRoundBridge(true);
      } else {
        // NEXT ROUND
        const nextNarratorId = getNextNarrator();
        setNextRoundNumber(currentRoundNumber + 1);
        broadcastRoundEnd(currentRoundNumber, nextNarratorId, state.players);
        setShowRoundBridge(true);
        setNextNarrator(nextNarratorId);
      }
    } else {
      const nextIdx = currentQuestionIndex + 1;
      advanceQuestionLocally(nextIdx);
      broadcastNextQuestion(nextIdx, state.players);
    }
    playAudio('notification');
  }, [
    currentQuestionIndex,
    currentRoundNumber,
    advanceQuestionLocally,
    getNextNarrator,
    setNextNarrator,
    setShowRoundBridge,
    setNextRoundNumber,    // ← added
    players,               // ← added
    state.players
  ]);

  // ───────────────────────────────────────────────────────────
  //  Time‐up handler (last‐question case)
  // ───────────────────────────────────────────────────────────
  const handleTimeUp = () => {
    const isLast = currentQuestionIndex === QUESTIONS_PER_ROUND - 1;
    if (isLast) {
      if (currentRoundNumber >= players.length) {
        // FINAL ROUND
        broadcastRoundEnd(currentRoundNumber, '', state.players, true);
        setShowRoundBridge(true);
      } else {
        // NEXT ROUND
        const nextNarratorId = getNextNarrator();
        setNextRoundNumber(currentRoundNumber + 1);
        broadcastRoundEnd(currentRoundNumber, nextNarratorId, state.players);
        setNextNarrator(nextNarratorId);
        setShowRoundBridge(true);
      }
    } else {
      const nextIdx = currentQuestionIndex + 1;
      advanceQuestionLocally(nextIdx);
      broadcastNextQuestion(nextIdx, state.players);
    }
  };

  return { handleCorrectAnswer, handleWrongAnswer, handleNextQuestion, handleTimeUp };
};
