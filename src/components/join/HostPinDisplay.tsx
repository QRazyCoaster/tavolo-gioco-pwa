
import React, { FormEvent } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import PlayerNameInput from '@/components/PlayerNameInput';

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
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-center mb-2">{t('common.yourGamePin')}</h3>
        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-2 text-center">
          <span className="text-3xl font-bold tracking-wider">{pin}</span>
        </div>
        <p className="text-center text-sm text-gray-600">{t('common.sharePinWithPlayers')}</p>
      </div>
      
      <div className="mt-6">
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label htmlFor="host-name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.chooseName')}
            </label>
            <input
              id="host-name"
              type="text"
              value={name}
              onChange={onNameChange}
              className="w-full px-4 py-2 border rounded-md"
              placeholder={language === 'it' ? 'Nome narratore' : 'Host name'}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-md disabled:opacity-50"
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
