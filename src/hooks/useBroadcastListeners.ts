
// src/hooks/useBroadcastListeners.ts
import { useEffect, useRef } from 'react'
import { useGame }            from '@/context/GameContext'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Round, PlayerAnswer } from '@/types/trivia'
import { QUESTION_TIMER }      from '@/utils/triviaConstants'

export const useBroadcastListeners = (
  gameChannel: RealtimeChannel | null,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  setNextNarrator: React.Dispatch<React.SetStateAction<string>>,
  setShowRoundBridge: React.Dispatch<React.SetStateAction<boolean>>,
  setNextRoundNumber: React.Dispatch<React.SetStateAction<number>>,
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>,
  dispatch: React.Dispatch<any>,
  gameId: string | null,
  currentRound: Round
) => {
  const { state } = useGame()
  const currentPlayerId = state.currentPlayer?.id
  const hasSetup = useRef(false)

  useEffect(() => {
    if (!gameChannel || hasSetup.current) return
    hasSetup.current = true

    console.log('[useBroadcastListeners] Setting up broadcast listeners for game channel');

    /* ───────────────────────── BUZZ ───────────────────────── */
    gameChannel.on(
      'broadcast',
      { event: 'BUZZ' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] Received BUZZ event', payload)
        const { playerId, playerName, questionIndex, timestamp } = payload
        
        if (!playerId || !playerName) {
          console.warn('[useBroadcastListeners] Invalid BUZZ payload:', payload)
          return
        }
        
        console.log('[useBroadcastListeners] Processing BUZZ for player:', playerName, 'at question index:', questionIndex)
        
        // Update the current round with the new player answer
        setCurrentRound(prev => {
          // Check if player already answered
          const existingAnswer = prev.playerAnswers.find(a => a.playerId === playerId);
          if (existingAnswer) {
            console.log('[useBroadcastListeners] Player already in queue, ignoring duplicate buzz');
            return prev;
          }
          
          const newAnswer: PlayerAnswer = { 
            playerId, 
            playerName, 
            timestamp: timestamp || Date.now() 
          };
          
          console.log('[useBroadcastListeners] Adding new answer to queue:', newAnswer);
          
          const updatedRound = { 
            ...prev, 
            playerAnswers: [...prev.playerAnswers, newAnswer] 
          };
          
          console.log('[useBroadcastListeners] Updated round playerAnswers:', updatedRound.playerAnswers);
          return updatedRound;
        });
        
        // Update answered players set
        setAnsweredPlayers(prev => {
          const newSet = new Set(prev);
          newSet.add(playerId);
          console.log('[useBroadcastListeners] Updated answered players:', Array.from(newSet));
          return newSet;
        });
        
        // Always show pending answers when someone buzzes
        console.log('[useBroadcastListeners] Setting showPendingAnswers to true');
        setShowPendingAnswers(true);
      }
    )

    /* ───────────────────────── NEXT_QUESTION ───────────────────────── */
    gameChannel.on(
      'broadcast',
      { event: 'NEXT_QUESTION' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] Received NEXT_QUESTION', payload)
        const { questionIndex, scores } = payload

        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) => {
            if (s && s.id !== undefined) {
              dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
            }
          })
        }

        setCurrentRound(prev => ({
          ...prev,
          currentQuestionIndex: questionIndex,
          playerAnswers: [],
          timeLeft: QUESTION_TIMER
        }))
        setAnsweredPlayers(new Set())
        setShowPendingAnswers(false)
      }
    )

    /* ───────────────────────── SCORE_UPDATE ───────────────────────── */
    gameChannel.on(
      'broadcast',
      { event: 'SCORE_UPDATE' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] Received SCORE_UPDATE', payload)
        const { scores } = payload
        if (!Array.isArray(scores)) return
        scores.forEach((s: { id: string; score: number }) => {
          if (s && s.id !== undefined) {
            dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
          }
        })
      }
    )

    /* ───────────────────────── ROUND_END ───────────────────────── */
    gameChannel.on(
      'broadcast',
      { event: 'ROUND_END' },
      ({ payload }: { payload: any }) => {
        console.log('[useBroadcastListeners] Received ROUND_END', payload)
        const { nextRound, nextNarratorId, scores, isGameOver = false } = payload

        console.log(
          `[useBroadcastListeners] ROUND_END on ${
            currentPlayerId === nextNarratorId ? 'Narrator' : 'Player'
          } client; payload.nextRound=${nextRound}`
        )

        if (Array.isArray(scores)) {
          scores.forEach((s: { id: string; score: number }) => {
            if (s && s.id !== undefined) {
              dispatch({ type: 'UPDATE_SCORE', payload: { playerId: s.id, score: s.score } })
            }
          })
        }

        setAnsweredPlayers(new Set())
        setShowPendingAnswers(false)

        if (isGameOver) {
          console.log('[useBroadcastListeners] FINAL round → showing game over immediately')
          setGameOver(true)
        } else {
          if (nextNarratorId) setNextNarrator(nextNarratorId)
          setNextRoundNumber(nextRound)
          console.log('[useBroadcastListeners] Showing RoundBridge')
          setShowRoundBridge(true)
        }
      }
    )

    /* ───────────────────────── housekeeping ───────────────────────── */
    const unsubscribe = () => {
      console.log('[useBroadcastListeners] Unsubscribing from game channel')
      gameChannel.unsubscribe()
    }

    return unsubscribe
  }, [
    gameChannel,
    dispatch,
    setCurrentRound,
    setAnsweredPlayers,
    setShowPendingAnswers,
    setNextNarrator,
    setShowRoundBridge,
    setNextRoundNumber,
    setGameOver,
    gameId,
    currentRound,
    currentPlayerId
  ])
}
