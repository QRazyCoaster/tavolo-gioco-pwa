import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Player } from '@/context/GameContext';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';

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

  useEffect(() => {
    setIsPressed(hasAnswered);
  }, [questionNumber, roundNumber, hasAnswered]);

  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  const handlePress = () => {
    if (hasAnswered || isCurrentPlayerNarrator) return;
    setIsPressed(true);

    if (window.myBuzzer) {
      window.myBuzzer.play().catch(() => playAudio('buzzer'));
    } else {
      playAudio('buzzer');
    }

    onBuzzerPressed();

    toast({
      title: language === 'it' ? 'Prenotazione effettuata!' : 'Buzz registered!',
      description: language === 'it' ? 'Sei in attesa di rispondere' : 'Waiting for your turn to answer'
    });
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto h-full">
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

      {isCurrentPlayerNarrator && (
        <div className="mb-4 bg-blue-100 text-blue-800 p-3 rounded-lg text-center">
          {language === 'it' ? 'Sei il narratore di questo round!' : 'You are the narrator for this round!'}
        </div>
      )}

      <div className="mb-4">
        <div className="bg-primary/10 px-4 py-2 rounded-md font-semibold text-center">
          {language === 'it'
            ? `Round ${roundNumber} • Domanda ${questionNumber}/${totalQuestions}`
            : `Round ${roundNumber} • Question ${questionNumber}/${totalQuestions}`}
        </div>
      </div>

      {hasAnswered && (
        <div className="mb-4 bg-green-100 text-green-800 p-3 rounded-lg text-center">
          {language === 'it' ? 'Ti sei prenotato! Attendi il tuo turno.' : 'You are queued! Waiting for your turn.'}
        </div>
      )}

      <div className="border rounded-lg overflow-hidden mt-4">
        <div className="bg-primary/10 px-4 py-2 font-semibold text-center">
          {language === 'it' ? 'Classifica Giocatori' : 'Player Rankings'}
        </div>
        <ScrollArea className="h-56 w-full">
          <div className="p-4">
            {sorted.map((p, i) => (
              <div
                key={p.id}
                className={`flex justify-between items-center py-2 border-b last:border-0 ${
                  p.id === state.currentPlayer?.id ? 'font-medium bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center">
                  <span className="text-gray-500 w-6">{i + 1}.</span>
                  <span>{p.name}</span>
                  {p.isHost && (
                    <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Host
                    </span>
                  )}
                </div>
                <span className="font-bold">{p.score || 0}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default PlayerView;
