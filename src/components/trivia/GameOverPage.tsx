
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player } from '@/context/GameContext';
import { motion } from 'framer-motion';
import { Trophy, Award, Medal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { playAudio } from '@/utils/audioUtils';

interface GameOverPageProps {
  players: Player[];
  onBackToLobby: () => void;
}

const GameOverPage: React.FC<GameOverPageProps> = ({ players, onBackToLobby }) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  // Sort players by score in descending order
  const rankedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  // Play victory sound when component mounts
  React.useEffect(() => {
    playAudio('success', { volume: 0.6 });
    
    toast({
      title: language === 'it' ? 'Gioco terminato!' : 'Game Over!',
      description: language === 'it' 
        ? 'La partita è terminata. Ecco i risultati finali!' 
        : 'The game has ended. Here are the final results!',
      duration: 5000,
    });
  }, []);
  
  // Define medal colors for top 3
  const getMedalIcon = (index: number) => {
    switch(index) {
      case 0: return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 1: return <Award className="h-8 w-8 text-gray-400" />;
      case 2: return <Medal className="h-8 w-8 text-amber-700" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-primary mb-2">
            {language === 'it' ? 'Gioco Terminato!' : 'Game Over!'}
          </h1>
          <p className="text-gray-600">
            {language === 'it' ? 'Ecco i risultati finali' : 'Here are the final results'}
          </p>
        </motion.div>
        
        {/* Winner podium for top 3 */}
        <motion.div 
          className="flex justify-center items-end h-60 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {rankedPlayers.slice(0, 3).map((player, index) => (
            <motion.div
              key={player.id}
              className={`flex flex-col items-center mx-4 ${
                index === 0 ? 'pb-0' : index === 1 ? 'pb-10' : 'pb-20'
              }`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.2, duration: 0.5 }}
            >
              <div className="mb-2">{getMedalIcon(index)}</div>
              <div className={`w-28 h-${index === 0 ? '40' : index === 1 ? '32' : '24'} 
                bg-gradient-to-t ${
                  index === 0 
                    ? 'from-yellow-400 to-yellow-200' 
                    : index === 1 
                      ? 'from-gray-300 to-gray-100' 
                      : 'from-amber-700 to-amber-500'
                } rounded-t-lg flex items-center justify-center`}>
                <span className="text-2xl font-bold text-white">{player.score || 0}</span>
              </div>
              <div className="max-w-28 truncate text-center mt-2 font-semibold">
                {player.name}
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Full rankings */}
        <Card className="p-5 mb-8">
          <h2 className="text-xl font-bold mb-4 text-center">
            {language === 'it' ? 'Classifica Completa' : 'Full Rankings'}
          </h2>
          
          <div className="space-y-2">
            {rankedPlayers.map((player, index) => (
              <motion.div 
                key={player.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  index === 0 
                    ? 'bg-yellow-50 border border-yellow-200' 
                    : index === 1 
                      ? 'bg-gray-50 border border-gray-200'
                      : index === 2
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-white border border-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <span className="w-8 text-center font-bold text-gray-500">
                    {index + 1}.
                  </span>
                  <span className="font-medium">{player.name}</span>
                </div>
                <span className="font-bold">{player.score || 0}</span>
              </motion.div>
            ))}
          </div>
        </Card>
        
        {/* Action buttons */}
        <div className="flex justify-center">
          <Button 
            onClick={onBackToLobby} 
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            {language === 'it' ? 'Torna alla Lobby' : 'Back to Lobby'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameOverPage;
