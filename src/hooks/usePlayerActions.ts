
import { useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { supabase } from '@/supabaseClient';
import { playAudio } from '@/utils/audioUtils';
import { PlayerAnswer } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { getGameChannel } from '@/utils/triviaBroadcast';

export const usePlayerActions = (
  gameId: string | null,
  currentQuestionIndex: number,
  currentQuestions: any[],
  setAnsweredPlayers: React.Dispatch<React.SetStateAction<Set<string>>>,
  setCurrentRound: React.Dispatch<React.SetStateAction<any>>,
  setShowPendingAnswers: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { state } = useGame();
  const { toast } = useToast();
  const { language } = useLanguage();

  const handlePlayerBuzzer = useCallback(async () => {
    if (!state.currentPlayer || !gameId) {
      console.error('[handlePlayerBuzzer] Missing player or game ID');
      return;
    }

    // Play buzzer sound
    window.myBuzzer
      ? window.myBuzzer.play().catch(() => playAudio('buzzer'))
      : playAudio('buzzer');

    const questionId = currentQuestions[currentQuestionIndex]?.id;
    if (!questionId) {
      console.error('[handlePlayerBuzzer] Invalid question ID at index', currentQuestionIndex);
      return;
    }

    console.log('[handlePlayerBuzzer] Player buzzing in:', state.currentPlayer.name, state.currentPlayer.id);

    // optimistic UI ----------------------------------------------------------
    const optimistic: PlayerAnswer = {
      playerId: state.currentPlayer.id,
      playerName: state.currentPlayer.name,
      timestamp: Date.now()
    };
    
    setCurrentRound(prev => {
      if (prev.playerAnswers.some(a => a.playerId === optimistic.playerId)) {
        console.log('[handlePlayerBuzzer] Player already in queue, skipping optimistic update');
        return prev;
      }
      console.log('[handlePlayerBuzzer] Adding player to queue (optimistic update):', optimistic);
      return { ...prev, playerAnswers: [...prev.playerAnswers, optimistic] };
    });
    
    setAnsweredPlayers(prev => {
      const newSet = new Set(prev);
      newSet.add(state.currentPlayer!.id);
      return newSet;
    });
    
    setShowPendingAnswers(true);

    // write + broadcast ------------------------------------------------------
    try {
      console.log('[handlePlayerBuzzer] Sending database update and broadcast...');
      
      // First broadcast to ensure real-time updates (even if DB operation fails)
      const ch = getGameChannel();
      if (ch) {
        ch.send({
          type: 'broadcast',
          event: 'BUZZ',
          payload: {
            playerId: state.currentPlayer.id,
            playerName: state.currentPlayer.name,
            questionIndex: currentQuestionIndex
          }
        }).then(() => {
          console.log('[handlePlayerBuzzer] Buzz broadcast sent successfully');
        }).catch(err => {
          console.error('[handlePlayerBuzzer] Error broadcasting buzz:', err);
        });
      } else {
        console.error('[handlePlayerBuzzer] No game channel available');
      }

      // Then update the database for persistence
      const { error } = await supabase
        .from('player_answers')
        .insert({
          game_id: gameId,
          question_id: questionId,
          player_id: state.currentPlayer.id,
          created_at: new Date().toISOString()
        });

      if (error && error.code !== '23505') {
        console.error('[handlePlayerBuzzer] insert error:', error);
      } else {
        console.log('[handlePlayerBuzzer] Database updated successfully');
      }
    } catch (err) {
      console.error('[handlePlayerBuzzer] network error', err);
    }

    toast({
      title: language === 'it' ? 'Prenotazione effettuata!' : 'Buzz registered!',
      description: language === 'it' ? 'Sei in attesa di rispondere' : 'Waiting for your turn to answer'
    });
  }, [
    state.currentPlayer,
    gameId,
    currentQuestionIndex,
    currentQuestions,
    setAnsweredPlayers,
    setCurrentRound,
    setShowPendingAnswers,
    toast,
    language
  ]);

  return { handlePlayerBuzzer };
};
