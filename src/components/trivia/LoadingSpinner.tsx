
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

const LoadingSpinner = () => {
  const { language } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse flex space-x-2 mb-4 justify-center">
          <div className="w-3 h-3 bg-blue-400 rounded-full" />
          <div className="w-3 h-3 bg-blue-400 rounded-full" />
          <div className="w-3 h-3 bg-blue-400 rounded-full" />
        </div>
        <p className="text-gray-600">
          {language === 'it' ? 'Caricamento...' : 'Loading...'}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
