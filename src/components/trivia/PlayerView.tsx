
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Player } from '@/context/GameContext';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';
import PlayerRankings from './PlayerRankings';

interface PlayerViewProps {
  roundNumber: number;
  questionNumber: number;
  totalQuestions: number;
  players: Player[];
  hasAnswered: boolean;
  onBuzzerPressed: () => void;
  isCurrentPlayerNarrator: boolean;
}

const PlayerView: React.FC<PlayerViewProps> = ({
  roundNumber,
  questionNumber,
  totalQuestions,
  players,
  hasAnswered,
  onBuzzerPressed,
  isCurrentPlayerNarrator
}) => {
  const { language } = useLanguage();
  const { state } = useGame();
  const { toast } = useToast();
  const [screenShake, setScreenShake] = useState(false);

  // Use the players directly from GameContext to ensure we always have the latest scores
  const currentPlayers = state.players;

  const handlePress = () => {
    // Don't allow buzzer press if player already answered or is the narrator
    if (hasAnswered || isCurrentPlayerNarrator) return;
    
    // Trigger screen shake animation
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);

    // Play buzzer sound
    if (window.myBuzzer) {
      window.myBuzzer.play().catch(() => playAudio('buzzer'));
    } else {
      playAudio('buzzer');
    }

    // Notify game system - this is the crucial part that communicates with the narrator
    onBuzzerPressed();

    // Show feedback to the player
    toast({
      title: language === 'it' ? 'Prenotazione effettuata!' : 'Buzz registered!',
      description: language === 'it' ? 'Sei in attesa di rispondere' : 'Waiting for your turn to answer'
    });
  };

  return (
    <div className={`flex flex-col w-full max-w-md mx-auto h-full transition-transform duration-300 ${
      screenShake ? 'animate-[shake_0.5s_ease-in-out]' : ''
    }`}>
      {/* Big 3D buzzer button */}
      <div className="flex justify-center items-center mb-8" style={{ height: '40vh' }}>
        <Button
          className={`w-64 h-64 rounded-full text-6xl font-black transition-all duration-200 flex items-center justify-center relative overflow-hidden ${
            hasAnswered || isCurrentPlayerNarrator
              ? 'bg-gray-400 cursor-not-allowed shadow-lg'
              : 'bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-2xl border-4 border-red-400 transform hover:scale-105 active:scale-95'
          } ${
            hasAnswered ? 'animate-pulse' : ''
          }`}
          style={{
            boxShadow: hasAnswered || isCurrentPlayerNarrator 
              ? '0 8px 16px rgba(0,0,0,0.3)' 
              : '0 12px 24px rgba(220, 38, 38, 0.4), inset 0 -8px 0 rgba(0,0,0,0.2)'
          }}
          onClick={handlePress}
          disabled={hasAnswered || isCurrentPlayerNarrator}
        >
          <div className="text-white drop-shadow-lg tracking-wider">
            {hasAnswered ? (
              <div className="text-3xl animate-bounce">
                {language === 'it' ? 'ATTESA...' : 'WAITING...'}
              </div>
            ) : (
              'PUSH'
            )}
          </div>
          
          {/* 3D highlight effect */}
          {!hasAnswered && !isCurrentPlayerNarrator && (
            <div className="absolute top-4 left-4 right-4 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-full blur-sm" />
          )}
        </Button>
      </div>

      {/* Narrator notification */}
      {isCurrentPlayerNarrator && (
        <div className="mb-4 bg-blue-100 text-blue-800 p-3 rounded-lg text-center animate-fade-in">
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

      {/* Answer status notification */}
      {hasAnswered && (
        <div className="mb-4 bg-green-100 text-green-800 p-3 rounded-lg text-center animate-fade-in">
          {language === 'it' ? 'Ti sei prenotato! Attendi il tuo turno.' : 'You are queued! Waiting for your turn.'}
        </div>
      )}

      {/* Player rankings */}
      <PlayerRankings players={currentPlayers} />
    </div>
  );
};

export default PlayerView;
