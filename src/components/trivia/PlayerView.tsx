
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Player } from '@/context/GameContext';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import { Hand, CircleCheck } from 'lucide-react';
import PlayerRankings from './PlayerRankings';

interface PlayerViewProps {
  roundNumber: number;
  questionNumber: number;
  totalQuestions: number;
  players: Player[];
  hasAnswered: boolean;
  isFirstInQueue: boolean;
  isEliminated: boolean;
  onBuzzerPressed: () => void;
  isCurrentPlayerNarrator: boolean;
}

const PlayerView: React.FC<PlayerViewProps> = ({
  roundNumber,
  questionNumber,
  totalQuestions,
  players,
  hasAnswered,
  isFirstInQueue,
  isEliminated,
  onBuzzerPressed,
  isCurrentPlayerNarrator
}) => {
  const { t, language } = useLanguage();
  const { state } = useGame();
  const { toast } = useToast();
  const [isPressed, setIsPressed] = useState(false);

  // Use the players directly from GameContext to ensure we always have the latest scores
  const currentPlayers = state.players;

  // Reset the pressed state when the question changes or when player role changes
  useEffect(() => {
    setIsPressed(hasAnswered);
  }, [questionNumber, roundNumber, hasAnswered, isCurrentPlayerNarrator]);

  const handlePress = () => {
    // Don't allow buzzer press if player already answered or is the narrator
    if (hasAnswered || isCurrentPlayerNarrator) return;
    
    // Update local UI state
    setIsPressed(true);

    // Play buzzer sound
    if (window.myBuzzer) {
      window.myBuzzer.play().catch(() => playAudio('buzzer'));
    } else {
      playAudio('buzzer');
    }

    // Notify game system
    onBuzzerPressed();

    // Show feedback to the player
    toast({
      title: t('common.loading'),
      description: t('trivia.waitingForQuestion')
    });
  };

  // Determine buzzer state and styling
  const getBuzzerState = () => {
    if (isCurrentPlayerNarrator) {
      return { disabled: true, style: 'narrator' };
    }
    if (isEliminated) {
      return { disabled: true, style: 'eliminated' };
    }
    if (!hasAnswered) {
      return { disabled: false, style: 'ready' };
    }
    if (isFirstInQueue) {
      return { disabled: true, style: 'go' };
    }
    return { disabled: true, style: 'wait' };
  };

  const buzzerState = getBuzzerState();

  return (
    <div className="flex flex-col w-full max-w-md mx-auto h-full">
      {/* Traffic light style buzzer button */}
      <div className="flex justify-center items-center mb-8" style={{ height: '40vh' }}>
        <Button
          className={`
            w-64 h-64 text-xl font-bold shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-4 px-4
            ${buzzerState.style === 'narrator' 
              ? 'bg-gray-400 cursor-not-allowed rounded-full' 
              : buzzerState.style === 'ready'
              ? 'bg-red-600 hover:bg-red-700 transform hover:scale-105 active:scale-95 rounded-full'
              : buzzerState.style === 'go'
              ? 'bg-green-600 hover:bg-green-600 cursor-not-allowed rounded-lg'
              : buzzerState.style === 'eliminated'
              ? 'bg-gray-500 cursor-not-allowed rounded-lg'
              : 'bg-red-800 hover:bg-red-800 cursor-not-allowed rounded-lg'
            }
          `}
          onClick={handlePress}
          disabled={buzzerState.disabled}
        >
          <div className="text-white flex flex-col items-center gap-3 text-center">
            {buzzerState.style === 'go' && (
              <>
                <span className="text-6xl">🎤</span>
                <span className="text-3xl font-bold leading-tight">{t('trivia.answerNow')}</span>
              </>
            )}
            {buzzerState.style === 'wait' && (
              <>
                <span className="text-6xl">✋</span>
                <span className="text-3xl font-bold leading-tight">{t('trivia.waitYourTurn')}</span>
              </>
            )}
            {buzzerState.style === 'ready' && (
              <span className="text-5xl font-bold">PUSH</span>
            )}
            {buzzerState.style === 'narrator' && (
              <span className="text-2xl">NARRATOR</span>
            )}
            {buzzerState.style === 'eliminated' && (
              <>
                <span className="text-6xl">🥴</span>
                <span className="text-3xl font-bold leading-tight">{t('trivia.eliminated')}</span>
              </>
            )}
          </div>
        </Button>
      </div>

      {/* Narrator notification */}
      {isCurrentPlayerNarrator && (
        <div className="mb-4 bg-blue-100 text-blue-800 p-3 rounded-lg text-center">
          {language === 'it' ? 'Sei il narratore di questo round!' : 'You are the narrator for this round!'}
        </div>
      )}

      {/* Round and question counter */}
      <div className="mb-4">
        <div className="bg-primary/10 px-4 py-2 rounded-md font-semibold text-center">
          {language === 'it'
            ? `Round ${roundNumber} • Domanda ${questionNumber}/${totalQuestions}`
            : `Round ${roundNumber} • Question ${questionNumber}/${totalQuestions}`}
        </div>
      </div>

      {/* Enhanced answer status notification */}
      {hasAnswered && isFirstInQueue && (
        <div className="mb-4 bg-green-100 text-green-800 p-3 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2">
            <CircleCheck size={20} />
            <span className="font-semibold">{t('trivia.answerNow')}</span>
          </div>
        </div>
      )}
      {hasAnswered && !isFirstInQueue && (
        <div className="mb-4 bg-red-100 text-red-800 p-3 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2">
            <Hand size={20} />
            <span className="font-semibold">{t('trivia.waitYourTurn')}</span>
          </div>
        </div>
      )}

      {/* Player rankings */}
      <PlayerRankings players={currentPlayers} />
    </div>
  );
};

export default PlayerView;
