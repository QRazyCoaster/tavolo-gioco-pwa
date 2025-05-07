
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/context/LanguageContext';
import { playAudio } from '@/utils/audioUtils';
import { 
  InputOTP,
  InputOTPGroup,
  InputOTPSlot 
} from "@/components/ui/input-otp";

interface GamePinInputProps {
  onSubmit: (pin: string) => void;
}

const GamePinInput = ({ onSubmit }: GamePinInputProps) => {
  const { t } = useLanguage();
  const [pin, setPin] = useState('');
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    // Check if pin is exactly 4 digits
    setIsValid(pin.length === 4 && /^\d{4}$/.test(pin));
  }, [pin]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      playAudio('buttonClick');
      onSubmit(pin);
    }
  };

  const handlePinChange = (value: string) => {
    setPin(value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-6 w-full max-w-sm">
      <label className="text-2xl font-semibold text-center">
        {t('common.enterPin')}
      </label>
      
      <div className="flex justify-center mb-4">
        <InputOTP 
          maxLength={4} 
          value={pin} 
          onChange={handlePinChange}
          pattern="\d{1}"
          inputMode="numeric"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="h-16 w-16 text-2xl" />
            <InputOTPSlot index={1} className="h-16 w-16 text-2xl" />
            <InputOTPSlot index={2} className="h-16 w-16 text-2xl" />
            <InputOTPSlot index={3} className="h-16 w-16 text-2xl" />
          </InputOTPGroup>
        </InputOTP>
      </div>
      
      <Button 
        type="submit"
        className="w-full h-14 text-xl" 
        variant="default" 
        disabled={!isValid}
      >
        {t('common.join')}
      </Button>
    </form>
  );
};

export default GamePinInput;
