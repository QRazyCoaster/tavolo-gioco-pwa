
import { useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient';
import { Round } from '@/types/trivia';
import { Player } from '@/context/GameContext';

export const useNarratorSubscription = (
  isNarrator: boolean,
  gameId: string | null,
  currentRound: Round,
  setCurrentRound: React.Dispatch<React.SetStateAction<Round>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>,
  players: Player[]
) => {
  const narratorSubRef = useRef<any>(null);
  const currentQuestionIndexRef = useRef<number>(currentRound.currentQuestionIndex);
  
  useEffect(() => {
    currentQuestionIndexRef.current = currentRound.currentQuestionIndex;
  }, [currentRound.currentQuestionIndex]);

  useEffect(() => {
    // Only continue if conditions are met to be a narrator
    if (!isNarrator || !gameId) {
      // Clean up existing subscription before returning
      if (narratorSubRef.current) {
        console.log('[useNarratorSubscription] Removing existing subscription on role/gameId change');
        supabase.removeChannel(narratorSubRef.current);
        narratorSubRef.current = null;
      }
      return;
    }

    // Clean up existing subscription before creating a new one
    if (narratorSubRef.current) {
      console.log('[useNarratorSubscription] Removing existing subscription before creating a new one');
      supabase.removeChannel(narratorSubRef.current);
      narratorSubRef.current = null;
    }

    const channelName = `buzzes_${gameId}_${currentRound.currentQuestionIndex}`;
    console.log(`[useNarratorSubscription] Creating channel: ${channelName}`);
    
    const dbCh = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'player_answers' },
        ({ new: row }: any) => {
          if (row.game_id !== gameId) return;
          const currentQ = currentRound.questions[currentQuestionIndexRef.current]?.id;
          if (row.question_id !== currentQ) return;

          console.log(`[useNarratorSubscription] Received DB notification for player_answer: ${row.player_id}`);
          
          setCurrentRound(prev => {
            if (prev.playerAnswers.some(a => a.playerId === row.player_id)) return prev;
            const player = players.find(p => p.id === row.player_id);
            if (!player) return prev;
            return {
              ...prev,
              playerAnswers: [
                ...prev.playerAnswers,
                { playerId: player.id, playerName: player.name, timestamp: Date.now() }
              ]
            };
          });
          setShowPendingAnswers(true);
        }
      )
      .subscribe();

    narratorSubRef.current = dbCh;
    
    return () => { 
      console.log(`[useNarratorSubscription] Cleaning up channel: ${channelName}`);
      if (narratorSubRef.current) {
        supabase.removeChannel(narratorSubRef.current);
        narratorSubRef.current = null;
      }
    };
  }, [
    isNarrator,
    gameId,
    currentRound.currentQuestionIndex,
    players,
    setCurrentRound,
    setShowPendingAnswers
  ]);

  return narratorSubRef;
};
