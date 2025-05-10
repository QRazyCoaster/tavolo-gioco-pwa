
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import PlayerNameInput from '@/components/PlayerNameInput';

interface HostPinDisplayProps {
  pin: string;
  name: string;
  loading: boolean;
  onSubmit: (name: string) => void;
}

const HostPinDisplay = ({ pin, name, loading, onSubmit }: HostPinDisplayProps) => {
  const { t, language } = useLanguage();
  
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-center mb-2">{t('common.yourGamePin')}</h3>
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-2 text-center">
          <span className="text-3xl font-bold tracking-wider">{pin}</span>
        </div>
        <p className="text-center text-sm text-gray-600">{t('common.sharePinWithPlayers')}</p>
      </div>
      
      <div className="mt-6">
        <PlayerNameInput 
          onSubmit={onSubmit} 
          initialValue={name}
        />
      </div>
    </div>
  );
};

export default HostPinDisplay;
