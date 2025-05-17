
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

  useEffect(() => {
    if (!isNarrator || !gameId) {
      narratorSubRef.current && supabase.removeChannel(narratorSubRef.current);
      narratorSubRef.current = null;
      return;
    }

    narratorSubRef.current && supabase.removeChannel(narratorSubRef.current);

    const dbCh = supabase
      .channel(`buzzes_${gameId}_${currentRound.currentQuestionIndex}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'player_answers' },
        ({ new: row }: any) => {
          if (row.game_id !== gameId) return;
          const currentQ = currentRound.questions[currentRound.currentQuestionIndex]?.id;
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
    return () => { void supabase.removeChannel(dbCh); };
  }, [
    isNarrator,
    gameId,
    currentRound.currentQuestionIndex,
    currentRound.questions,
    players,
    setCurrentRound,
    setShowPendingAnswers
  ]);

  return narratorSubRef;
};
