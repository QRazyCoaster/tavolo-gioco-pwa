
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
    console.log('[handlePlayerBuzzer] Starting buzz process', {
      currentPlayer: state.currentPlayer,
      gameId,
      currentQuestionIndex,
      questionsLength: currentQuestions.length
    });

    if (!state.currentPlayer || !gameId) {
      console.error('[handlePlayerBuzzer] Missing required data:', {
        currentPlayer: state.currentPlayer,
        gameId
      });
      return;
    }

    // Play buzzer sound first
    window.myBuzzer
      ? window.myBuzzer.play().catch(() => playAudio('buzzer'))
      : playAudio('buzzer');

    // Check if we have a valid question
    const currentQuestion = currentQuestions[currentQuestionIndex];
    if (!currentQuestion) {
      console.error('[handlePlayerBuzzer] No question available at index', currentQuestionIndex, 'Questions:', currentQuestions);
      // Still proceed with buzz even if question ID is missing
    }

    const questionId = currentQuestion?.id || `question-${currentQuestionIndex}`;
    console.log('[handlePlayerBuzzer] Using question ID:', questionId);

    // Create optimistic answer
    const optimistic: PlayerAnswer = {
      playerId: state.currentPlayer.id,
      playerName: state.currentPlayer.name,
      timestamp: Date.now()
    };
    
    console.log('[handlePlayerBuzzer] Creating optimistic answer:', optimistic);
    
    // Update local UI state immediately
    setCurrentRound(prev => {
      const existingAnswer = prev.playerAnswers.find(a => a.playerId === optimistic.playerId);
      if (existingAnswer) {
        console.log('[handlePlayerBuzzer] Player already answered, skipping');
        return prev;
      }
      console.log('[handlePlayerBuzzer] Adding answer to local state');
      return { ...prev, playerAnswers: [...prev.playerAnswers, optimistic] };
    });
    
    setAnsweredPlayers(prev => {
      const newSet = new Set(prev);
      newSet.add(state.currentPlayer!.id);
      console.log('[handlePlayerBuzzer] Updated answered players:', Array.from(newSet));
      return newSet;
    });
    
    setShowPendingAnswers(true);
    console.log('[handlePlayerBuzzer] Set showPendingAnswers to true');

    // Broadcast the buzz event
    try {
      const gameChannel = getGameChannel();
      if (gameChannel) {
        console.log('[handlePlayerBuzzer] Broadcasting buzz event', {
          playerId: state.currentPlayer.id,
          playerName: state.currentPlayer.name,
          questionIndex: currentQuestionIndex
        });
        
        await gameChannel.send({
          type: 'broadcast',
          event: 'BUZZ',
          payload: {
            playerId: state.currentPlayer.id,
            playerName: state.currentPlayer.name,
            questionIndex: currentQuestionIndex,
            timestamp: Date.now()
          }
        });
        
        console.log('[handlePlayerBuzzer] Buzz event broadcasted successfully');
      } else {
        console.error('[handlePlayerBuzzer] Game channel not available for broadcasting');
      }

      // Also try to write to database (optional, buzz should work without this)
      if (currentQuestion?.id) {
        const { error } = await supabase
          .from('player_answers')
          .insert({
            game_id: gameId,
            question_id: questionId,
            player_id: state.currentPlayer.id,
            created_at: new Date().toISOString()
          });

        if (error && error.code !== '23505') {
          console.warn('[handlePlayerBuzzer] Database insert warning (non-critical):', error);
        } else {
          console.log('[handlePlayerBuzzer] Database insert successful');
        }
      }
    } catch (err) {
      console.error('[handlePlayerBuzzer] Broadcasting error:', err);
      // Don't fail the buzz if broadcasting fails, the optimistic update should still work
    }

    // Show user feedback
    toast({
      title: language === 'it' ? 'Prenotazione effettuata!' : 'Buzz registered!',
      description: language === 'it' ? 'Sei in attesa di rispondere' : 'Waiting for your turn to answer'
    });
    
    console.log('[handlePlayerBuzzer] Buzz process completed');
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
