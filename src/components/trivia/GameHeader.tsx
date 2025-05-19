
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface GameHeaderProps {
  pin: string;
}

const GameHeader: React.FC<GameHeaderProps> = ({ pin }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const handleBackToLobby = () => navigate('/waiting-room');
  
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToLobby}
          className="mr-2"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold text-primary">Trivia</h1>
      </div>

      <div className="bg-primary px-3 py-1 rounded-lg text-white text-center">
        <span className="text-sm font-semibold">{t('common.pin')}: </span>
        <span className="text-lg font-bold tracking-wider">{pin}</span>
      </div>
    </div>
  );
};

export default GameHeader;
