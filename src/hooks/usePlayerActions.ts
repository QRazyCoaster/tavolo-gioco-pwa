
import { useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { supabase } from '@/supabaseClient';
import { playAudio } from '@/utils/audioUtils';
import { PlayerAnswer } from '@/types/trivia';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';

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
    // Make sure the current player isn't the narrator, hasn't already answered, and there's a valid game
    if (!state.currentPlayer || !gameId) return;

    // Play buzzer sound
    window.myBuzzer ? window.myBuzzer.play().catch(() => playAudio('buzzer'))
                    : playAudio('buzzer');

    // Get the current question ID - ensure we're using the correct index
    const questionId = currentQuestions[currentQuestionIndex]?.id;
    if (!questionId) {
      console.error('[handlePlayerBuzzer] Invalid question ID at index', currentQuestionIndex);
      return;
    }

    try {
      // First optimistically update local state for quick UI feedback
      const optimistic: PlayerAnswer = {
        playerId: state.currentPlayer.id,
        playerName: state.currentPlayer.name,
        timestamp: Date.now()
      };
      
      // Add the player to the answer list if not already there
      setCurrentRound(prev => {
        const alreadyAnswered = prev.playerAnswers.some(a => a.playerId === optimistic.playerId);
        if (alreadyAnswered) return prev;
        
        return { 
          ...prev, 
          playerAnswers: [...prev.playerAnswers, optimistic] 
        };
      });
      
      // Mark this player as having answered
      setAnsweredPlayers(prev => new Set(prev).add(state.currentPlayer!.id));
      
      // Make sure the narrator sees the pending answers
      setShowPendingAnswers(true);

      // Then store the answer in the database with retry mechanism
      // We'll try up to 3 times with exponential backoff
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      
      while (attempts < maxAttempts && !success) {
        console.log(`[handlePlayerBuzzer] Sending answer attempt ${attempts + 1} for player ${state.currentPlayer.id}`);
        const { error } = await supabase
          .from('player_answers')
          .insert({ 
            game_id: gameId, 
            question_id: questionId, 
            player_id: state.currentPlayer.id,
            created_at: new Date().toISOString() // Explicitly set timestamp
          });

        if (!error || error.code === '23505') {
          // Success or duplicate entry (player already buzzed)
          success = true;
          console.log(`[handlePlayerBuzzer] Player answer recorded successfully: ${state.currentPlayer.id}`);
        } else {
          console.error(`[handlePlayerBuzzer] insert error attempt ${attempts + 1}:`, error);
          attempts++;
          if (attempts < maxAttempts) {
            // Wait with exponential backoff
            const delay = 300 * Math.pow(2, attempts);
            console.log(`[handlePlayerBuzzer] Retrying after ${delay}ms`);
            await new Promise(r => setTimeout(r, delay));
          }
        }
      }

      // Show feedback to the player
      toast({
        title: language === 'it' ? 'Prenotazione effettuata!' : 'Buzz registered!',
        description: language === 'it' ? 'Sei in attesa di rispondere' : 'Waiting for your turn to answer'
      });
    } catch (err) {
      console.error('[handlePlayerBuzzer] network error', err);
    }
  }, [state.currentPlayer, gameId, currentQuestionIndex, setAnsweredPlayers, setCurrentRound, setShowPendingAnswers, toast, language, currentQuestions]);

  return {
    handlePlayerBuzzer
  };
};
