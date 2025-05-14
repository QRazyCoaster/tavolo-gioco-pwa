
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/context/LanguageContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  InputOTP,
  InputOTPGroup,
  InputOTPSlot 
} from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";

interface PlayerJoinFormProps {
  pin: string;
  name: string;
  loading: boolean;
  showPinError: boolean;
  onPinChange: (value: string) => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const PlayerJoinForm = ({
  pin,
  name,
  loading,
  showPinError,
  onPinChange,
  onNameChange,
  onSubmit
}: PlayerJoinFormProps) => {
  const { t, language } = useLanguage();
  
  // Debug info for form submission
  useEffect(() => {
    console.log('[PlayerJoinForm] Current state:', { 
      pin, 
      name, 
      pinLength: pin.length,
      nameLength: name.length,
      loading,
      formValid: pin.length === 4 && name.trim().length > 0
    });
  }, [pin, name, loading]);
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PlayerJoinForm] Form submitted, will call onSubmit handler');
    
    // Call the actual submit handler
    onSubmit(e);
  };
  
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
      <form onSubmit={handleFormSubmit} className="flex flex-col space-y-6">
        <div>
          <label className="text-2xl font-semibold text-center block mb-4">
            {t('common.enterPin')}
          </label>
          
          <div className="flex justify-center mb-2">
            <InputOTP 
              maxLength={4} 
              value={pin} 
              onChange={onPinChange}
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
          
          {showPinError && (
            <Alert variant="destructive" className="mt-2 mb-2">
              <AlertDescription>
                {language === 'it' ? 'PIN non valido' : 'Invalid PIN'}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="mt-4">
          <label htmlFor="player-name" className="text-2xl font-semibold text-center block mb-4">
            {t('common.chooseName')}
          </label>
          <Input
            id="player-name"
            type="text"
            value={name}
            onChange={onNameChange}
            className="text-2xl text-center h-16 w-full border rounded-md p-2"
            placeholder={language === 'it' ? 'Nome giocatore' : 'Player name'}
            maxLength={20}
          />
        </div>
        
        <Button 
          type="submit"
          className="w-full h-14 text-xl" 
          variant="default" 
          disabled={!pin || !name.trim() || pin.length !== 4 || loading}
        >
          {loading ? 
            (language === 'it' ? 'Attendi...' : 'Loading...') : 
            t('common.join')}
        </Button>
      </form>
    </div>
  );
};

export default PlayerJoinForm;
