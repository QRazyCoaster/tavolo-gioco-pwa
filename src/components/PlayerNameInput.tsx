
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/context/LanguageContext';
import { playAudio } from '@/utils/audioUtils';

interface PlayerNameInputProps {
  onSubmit: (name: string) => void;
  initialValue?: string;
}

const PlayerNameInput = ({ onSubmit, initialValue = '' }: PlayerNameInputProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState(initialValue);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      playAudio('buttonClick');
      onSubmit(name);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-full max-w-sm">
      <label htmlFor="player-name" className="text-2xl font-semibold text-center">
        {t('common.chooseName')}
      </label>
      <Input
        id="player-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-2xl text-center h-16"
        placeholder="Player name"
        maxLength={20}
      />
      <Button 
        type="submit"
        className="w-full h-14 text-xl" 
        variant="default" 
        disabled={!name.trim()}
      >
        {t('common.next')}
      </Button>
    </form>
  );
};

export default PlayerNameInput;
