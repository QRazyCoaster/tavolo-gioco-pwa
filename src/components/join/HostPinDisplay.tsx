
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import PlayerNameInput from '@/components/PlayerNameInput';

interface HostPinDisplayProps {
  pin: string;
  name: string;
  loading: boolean;
  onNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const HostPinDisplay = ({ pin, name, loading, onNameChange, onSubmit }: HostPinDisplayProps) => {
  const { t } = useLanguage();
  
  const handleNameSubmit = (submittedName: string) => {
    // First update the name
    onNameChange(submittedName);
    
    // Then trigger form submission
    // Create a synthetic form event
    const formEvent = new Event('submit') as unknown as React.FormEvent;
    onSubmit(formEvent);
  };
  
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="flex justify-center items-center mb-6 text-center">
        <div className="bg-blue-50 text-blue-800 p-3 rounded-lg mb-2 w-full">
          <span className="block text-lg font-semibold mb-1">{t('common.pin')}: </span>
          <span className="text-3xl font-bold tracking-wider">{pin}</span>
        </div>
      </div>
      
      <div className="mt-2">
        <PlayerNameInput 
          onSubmit={handleNameSubmit} 
          initialValue={name} 
        />
      </div>
    </div>
  );
};

export default HostPinDisplay;
