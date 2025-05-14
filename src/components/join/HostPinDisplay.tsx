
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

const HostPinDisplay = ({ name, loading, onNameChange, onSubmit }: HostPinDisplayProps) => {
  const { t } = useLanguage();
  
  const handleNameSubmit = (submittedName: string) => {
    // First update the name
    onNameChange(submittedName);
    
    // Then trigger form submission with a small delay to ensure name is set
    setTimeout(() => {
      const formEvent = new Event('submit') as unknown as React.FormEvent;
      onSubmit(formEvent);
    }, 10);
  };
  
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
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
