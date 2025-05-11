
import React, { FormEvent } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface HostPinDisplayProps {
  pin: string;
  name: string;
  loading: boolean;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
}

const HostPinDisplay = ({ pin, name, loading, onNameChange, onSubmit }: HostPinDisplayProps) => {
  const { t, language } = useLanguage();
  
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
      <div className="mt-2">
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label htmlFor="host-name" className="block text-xl font-semibold text-center mb-4">
              {t('common.chooseName')}
            </label>
            <input
              id="host-name"
              type="text"
              value={name}
              onChange={onNameChange}
              className="w-full px-4 py-2 border rounded-md text-center text-lg"
              placeholder={language === 'it' ? 'Nome narratore' : 'Host name'}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-md disabled:opacity-50 mt-4"
            disabled={!name.trim() || loading}
          >
            {loading ? (language === 'it' ? 'Attendi...' : 'Loading...') : (language === 'it' ? 'Continua' : 'Continue')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HostPinDisplay;
