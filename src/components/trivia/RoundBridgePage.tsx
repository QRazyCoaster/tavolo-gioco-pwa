
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Card } from '@/components/ui/card';
import { Player } from '@/context/GameContext';
import { motion } from 'framer-motion';

interface RoundBridgePageProps {
  nextRoundNumber: number;
  nextNarrator: Player | null;
  onCountdownComplete: () => void;
}

const RoundBridgePage: React.FC<RoundBridgePageProps> = ({
  nextRoundNumber,
  nextNarrator,
  onCountdownComplete
}) => {
  const { language } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<number>(6);
  
  // Countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onCountdownComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [onCountdownComplete]);

  // Make sure we have a valid narrator
  if (!nextNarrator) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="text-center space-y-8 max-w-lg w-full">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-primary">
            {language === 'it' 
              ? `Pronti per il Round ${nextRoundNumber}?` 
              : `Ready for Round ${nextRoundNumber}?`}
          </h1>
        </motion.div>

        <Card className="p-6 bg-gradient-to-r from-violet-100 to-purple-100 border-2 border-primary/20">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className="text-2xl text-center mb-2">
              {language === 'it' ? 'Il narratore sarà:' : 'The narrator will be:'}
            </h2>
            <p className="text-3xl font-bold text-center text-primary">{nextNarrator.name}</p>
          </motion.div>
        </Card>
        
        {/* Creative visual countdown */}
        <div className="mt-12 relative h-4">
          <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
          <motion.div 
            className="absolute inset-0 bg-primary rounded-full"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ 
              duration: 6,
              ease: "linear"
            }}
          />
          
          {/* Pulsing dots */}
          <div className="absolute inset-0 flex justify-between items-center px-1">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className={`h-3 w-3 rounded-full ${timeLeft > i ? 'bg-white' : 'bg-transparent'}`}
                animate={{ 
                  scale: timeLeft === i+1 ? [1, 1.5, 1] : 1,
                  opacity: timeLeft > i ? 1 : 0.3
                }}
                transition={{ duration: 0.5, repeat: timeLeft === i+1 ? 1 : 0 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundBridgePage;
