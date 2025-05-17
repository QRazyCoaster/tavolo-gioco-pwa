
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

    // Get the current question ID
    const questionId = currentQuestions[currentQuestionIndex].id;

    try {
      // Store the answer in the database
      const { error } = await supabase
        .from('player_answers')
        .insert({ game_id: gameId, question_id: questionId, player_id: state.currentPlayer.id });

      if (error && error.code !== '23505') {
        console.error('[handlePlayerBuzzer] insert error', error);
      }
    } catch (err) {
      console.error('[handlePlayerBuzzer] network error', err);
    }

    // Optimistically update local state for quick UI feedback
    const optimistic: PlayerAnswer = {
      playerId: state.currentPlayer.id,
      playerName: state.currentPlayer.name,
      timestamp: Date.now()
    };
    
    // Add the player to the answer list if not already there
    setCurrentRound(prev =>
      prev.playerAnswers.some(a => a.playerId === optimistic.playerId)
        ? prev
        : { ...prev, playerAnswers: [...prev.playerAnswers, optimistic] }
    );
    
    // Mark this player as having answered
    setAnsweredPlayers(prev => new Set(prev).add(state.currentPlayer!.id));
    
    // Make sure the narrator sees the pending answers
    setShowPendingAnswers(true);

    // Show feedback to the player
    toast({
      title: language === 'it' ? 'Prenotazione effettuata!' : 'Buzz registered!',
      description: language === 'it' ? 'Sei in attesa di rispondere' : 'Waiting for your turn to answer'
    });
  }, [state.currentPlayer, gameId, currentQuestionIndex, setAnsweredPlayers, setCurrentRound, setShowPendingAnswers, toast, language, currentQuestions]);

  return {
    handlePlayerBuzzer
  };
};
