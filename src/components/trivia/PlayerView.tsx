
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
  const [isPressed, setIsPressed] = useState(false);
  const [localQuestionNumber, setLocalQuestionNumber] = useState(questionNumber);
  
  // Use the players directly from GameContext to ensure we always have the latest scores
  const currentPlayers = state.players;

  // Reset the pressed state when the question changes or when player role changes
  useEffect(() => {
    setIsPressed(hasAnswered);
  }, [questionNumber, roundNumber, hasAnswered, isCurrentPlayerNarrator]);

  // Update local question number when props change
  useEffect(() => {
    console.log('[PlayerView] Question number updated:', questionNumber);
    setLocalQuestionNumber(questionNumber);
  }, [questionNumber]);

  // Add a debugging effect to monitor score changes
  useEffect(() => {
    console.log('[PlayerView] Updated player scores:', currentPlayers.map(p => ({ id: p.id, name: p.name, score: p.score })));
    console.log('[PlayerView] Current question number:', questionNumber, 'of', totalQuestions);
  }, [currentPlayers, questionNumber, totalQuestions]);

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
      title: language === 'it' ? 'Prenotazione effettuata!' : 'Buzz registered!',
      description: language === 'it' ? 'Sei in attesa di rispondere' : 'Waiting for your turn to answer'
    });
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto h-full">
      {/* Big buzzer button */}
      <div className="flex justify-center items-center mb-8" style={{ height: '40vh' }}>
        <Button
          className={`w-64 h-64 rounded-full text-2xl font-bold shadow-xl transition-all duration-300 flex items-center justify-center ${
            hasAnswered || isCurrentPlayerNarrator
              ? 'bg-gray-400 cursor-not-allowed'
              : isPressed
              ? 'bg-red-700 hover:bg-red-700 border-4 border-blue-200'
              : 'bg-red-600 hover:bg-red-700 transform hover:scale-105 active:scale-95'
          }`}
          onClick={handlePress}
          disabled={hasAnswered || isCurrentPlayerNarrator}
        >
          <div className="text-white">
            {isPressed ? (language === 'it' ? 'ATTESA' : 'WAITING') : 'PUSH'}
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
            ? `Round ${roundNumber} • Domanda ${localQuestionNumber}/${totalQuestions}`
            : `Round ${roundNumber} • Question ${localQuestionNumber}/${totalQuestions}`}
        </div>
      </div>

      {/* Answer status notification */}
      {hasAnswered && (
        <div className="mb-4 bg-green-100 text-green-800 p-3 rounded-lg text-center">
          {language === 'it' ? 'Ti sei prenotato! Attendi il tuo turno.' : 'You are queued! Waiting for your turn.'}
        </div>
      )}

      {/* Player rankings with live score updates */}
      <PlayerRankings players={currentPlayers} />
    </div>
  );
};

export default PlayerView;
