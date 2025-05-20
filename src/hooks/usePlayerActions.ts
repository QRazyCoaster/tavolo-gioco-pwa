
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
    if (!state.currentPlayer || !gameId) return;

    window.myBuzzer
      ? window.myBuzzer.play().catch(() => playAudio('buzzer'))
      : playAudio('buzzer');

    const questionId = currentQuestions[currentQuestionIndex]?.id;
    if (!questionId) {
      console.error('[handlePlayerBuzzer] Invalid question ID at index', currentQuestionIndex);
      return;
    }

    // optimistic UI ----------------------------------------------------------
    const optimistic: PlayerAnswer = {
      playerId: state.currentPlayer.id,
      playerName: state.currentPlayer.name,
      timestamp: Date.now()
    };
    
    // Update local UI state
    setCurrentRound(prev => {
      if (prev.playerAnswers.some(a => a.playerId === optimistic.playerId)) return prev;
      return { ...prev, playerAnswers: [...prev.playerAnswers, optimistic] };
    });
    setAnsweredPlayers(prev => new Set(prev).add(state.currentPlayer!.id));
    setShowPendingAnswers(true);

    // write + broadcast ------------------------------------------------------
    try {
      // Write to database
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
      }

      // Get the game channel and broadcast the buzz event
      const gameChannel = getGameChannel();
      if (gameChannel) {
        console.log('[handlePlayerBuzzer] Broadcasting buzz event', {
          playerId: state.currentPlayer.id,
          playerName: state.currentPlayer.name,
          questionIndex: currentQuestionIndex
        });
        
        gameChannel.send({
          type: 'broadcast',
          event: 'BUZZ',
          payload: {
            playerId: state.currentPlayer.id,
            playerName: state.currentPlayer.name,
            questionIndex: currentQuestionIndex
          }
        });
      } else {
        console.error('[handlePlayerBuzzer] Game channel not available for broadcasting');
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
