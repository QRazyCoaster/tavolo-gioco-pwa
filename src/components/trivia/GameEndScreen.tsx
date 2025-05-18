
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player } from '@/context/GameContext';
import { Trophy } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { playAudio } from '@/utils/audioUtils';
import { Button } from '@/components/ui/button';

interface GameEndScreenProps {
  players: Player[];
  autoRedirectTime?: number;
}

const GameEndScreen: React.FC<GameEndScreenProps> = ({ 
  players, 
  autoRedirectTime = 20 
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(autoRedirectTime);
  
  // Sort players by score to find winner and loser
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const winner = sortedPlayers[0];
  const loser = sortedPlayers[sortedPlayers.length - 1];
  
  // Redirect timer
  useEffect(() => {
    // Play victory sound when component mounts
    playAudio('success');
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);
  
  // Early return if no players
  if (!winner || !loser) return null;
  
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[70vh] animate-fade-in">
      {/* Winner section */}
      <div className="bg-gradient-to-b from-yellow-100 to-yellow-200 p-8 rounded-xl shadow-lg mb-8 w-full max-w-md text-center">
        <div className="flex items-center justify-center mb-4">
          <Trophy className="text-yellow-500 mr-2" size={32} />
          <h2 className="text-2xl font-bold text-primary">
            {language === 'it' ? 'Vincitore!' : 'Winner!'}
          </h2>
          <Trophy className="text-yellow-500 ml-2" size={32} />
        </div>
        
        <div className="text-3xl font-bold mb-2 text-primary">{winner.name}</div>
        <div className="text-xl mb-4">{winner.score} {language === 'it' ? 'punti' : 'points'}</div>
        <p className="text-lg font-medium">
          {language === 'it' 
            ? 'Hai vinto! Fatti offrire da bere dai tuoi amici.'
            : 'You win! Get your friends to buy you a drink.'}
        </p>
      </div>
      
      {/* Loser section */}
      <div className="bg-gray-100 p-6 rounded-lg shadow w-full max-w-md text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          {language === 'it' ? 'Ultimo classificato' : 'Last Place'}
        </h3>
        <div className="text-xl font-medium mb-1 text-gray-800">{loser.name}</div>
        <div className="text-lg mb-3">{loser.score} {language === 'it' ? 'punti' : 'points'}</div>
        <p className="text-md text-gray-700">
          {language === 'it'
            ? 'Hai perso... Alzati e fissa il soffitto per 120 secondi.'
            : 'You Lose... Stand up and stare at the ceiling for 120 seconds.'}
        </p>
      </div>
      
      {/* Redirect timer */}
      <div className="text-center text-gray-600">
        {language === 'it'
          ? `Ritorno alla home in ${timeLeft} secondi...`
          : `Returning to home in ${timeLeft} seconds...`}
      </div>
      
      <Button 
        onClick={() => navigate('/')} 
        variant="outline" 
        className="mt-4"
      >
        {language === 'it' ? 'Torna alla Home' : 'Return Home'}
      </Button>
    </div>
  );
};

export default GameEndScreen;
