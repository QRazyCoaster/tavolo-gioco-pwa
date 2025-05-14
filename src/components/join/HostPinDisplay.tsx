
import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import PlayerNameInput from '@/components/PlayerNameInput';
import { Button } from "@/components/ui/button";

interface HostPinDisplayProps {
  pin: string;
  name: string;
  loading: boolean;
  onNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const HostPinDisplay = ({ name, loading, onNameChange, onSubmit }: HostPinDisplayProps) => {
  const { t } = useLanguage();
  const [localName, setLocalName] = useState(name);
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitted || !localName.trim()) return;
    
    console.log('[HostPinDisplay] Form submitted manually with name:', localName);
    setSubmitted(true);
    
    // Update the name in parent component
    onNameChange(localName);
    
    // Submit the form directly
    onSubmit(e);
  };
  
  const handleNameChange = (newName: string) => {
    setLocalName(newName);
    onNameChange(newName);
  };
  
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-full max-w-sm mx-auto">
        <label htmlFor="player-name" className="text-2xl font-semibold text-center">
          {t('common.chooseName')}
        </label>
        
        <input
          id="player-name"
          type="text"
          value={localName}
          onChange={(e) => handleNameChange(e.target.value)}
          className="text-2xl text-center h-16 rounded-md border border-input px-3 py-2"
          placeholder="Player name"
          maxLength={20}
          disabled={loading}
        />
        
        <Button 
          type="submit"
          className="w-full h-14 text-xl" 
          variant="default"
          disabled={!localName.trim() || loading}
        >
          {loading ? t('common.loading') : t('common.next')}
        </Button>
      </form>
    </div>
  );
};

export default HostPinDisplay;
