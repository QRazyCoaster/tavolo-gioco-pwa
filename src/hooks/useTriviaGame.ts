
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from 'react'
import { useGame } from '@/context/GameContext'
import { Round } from '@/types/trivia'
import {
  mockQuestions,
  QUESTION_TIMER,
  QUESTIONS_PER_ROUND,
  MAX_ROUNDS
} from '@/utils/triviaConstants'
import {
  broadcastNextQuestion,
  broadcastRoundEnd
} from '@/utils/triviaBroadcast'
import { useRoundManager } from './useRoundManager'
import { useRoundProgress } from './useRoundProgress'
import { useQuestionManager } from './useQuestionManager'
import { usePlayerActions } from './usePlayerActions'
import { useNarratorActions } from './useNarratorActions'
import { useGameChannel } from './useGameChannel'
import { useBroadcastListeners } from './useBroadcastListeners'
import { useNarratorSubscription } from './useNarratorSubscription'
import { useNarratorTimer } from './useNarratorTimer'

export const useTriviaGame = () => {
  const { state, dispatch } = useGame()

  // ───────── Round state & helpers ─────────
  const hostId = state.players.find(p => p.isHost)?.id ?? ''
  const {
    currentRound,
    setCurrentRound,
    answeredPlayers,
    setAnsweredPlayers,
    showPendingAnswers,
    setShowPendingAnswers
  } = useRoundManager(hostId)

  // ───────── Round progression ─────────
  const {
    showRoundBridge,
    setShowRoundBridge,
    nextNarrator,
    nextRoundNumber,
    gameOver,
    setGameOver,
    setNextNarrator,
    handleNextQuestion,
    startNextRound
  } = useRoundProgress(
    currentRound,
    setCurrentRound,
    state.players,
    setAnsweredPlayers,
    setShowPendingAnswers
  )

  // ───────── Channel & listeners ─────────
  const gameChannelRef = useGameChannel(state.gameId)

  useBroadcastListeners(
    gameChannelRef.current,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setNextNarrator,
    setShowRoundBridge,
    setGameOver,
    dispatch,
    state.gameId,
    currentRound
  )

  useNarratorSubscription(
    state.currentPlayer?.id === currentRound.narratorId,
    state.gameId,
    currentRound,
    setCurrentRound,
    setShowPendingAnswers,
    state.players
  )

  // ───────── Question state ─────────
  const { currentQuestion, questionNumber, totalQuestions } =
    useQuestionManager(currentRound)

  // ───────── Player & Narrator actions ─────────
  const { handlePlayerBuzzer } = usePlayerActions(
    state.gameId,
    currentRound.currentQuestionIndex,
    currentRound.questions,
    setAnsweredPlayers,
    setCurrentRound,
    setShowPendingAnswers
  )
  const { handleCorrectAnswer, handleWrongAnswer } = useNarratorActions(
    state,
    currentRound,
    setCurrentRound,
    gameChannelRef.current,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setShowRoundBridge,
    setGameOver,
    dispatch
  )

  // ───────── Narrator timer ─────────
  useNarratorTimer(
    state.currentPlayer?.id === currentRound.narratorId,
    showRoundBridge,
    gameOver,
    setCurrentRound,
    handleNextQuestion
  )

  return {
    currentRound,
    isNarrator: state.currentPlayer?.id === currentRound.narratorId,
    hasPlayerAnswered: answeredPlayers.has(state.currentPlayer?.id ?? ''),
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
    nextNarrator: state.players.find(p => p.id === nextNarrator) ?? null,
    nextRoundNumber,
    startNextRound,
    gameOver,
  }
}
