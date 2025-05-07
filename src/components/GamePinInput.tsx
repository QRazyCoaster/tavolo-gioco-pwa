
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/context/LanguageContext';
import { playAudio } from '@/utils/audioUtils';

interface GamePinInputProps {
  onSubmit: (pin: string) => void;
}

const GamePinInput = ({ onSubmit }: GamePinInputProps) => {
  const { t } = useLanguage();
  const [pin, setPin] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length === 4) {
      playAudio('buttonClick');
      onSubmit(pin);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-full max-w-sm">
      <label htmlFor="pin" className="text-2xl font-semibold text-center">
        {t('common.enterPin')}
      </label>
      <Input
        id="pin"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{4}"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        className="text-3xl text-center tracking-widest h-16"
        placeholder="0000"
      />
      <Button 
        type="submit"
        className="w-full h-14 text-xl" 
        variant="default" 
        disabled={pin.trim().length !== 4}
      >
        {t('common.join')}
      </Button>
    </form>
  );
};

export default GamePinInput;
