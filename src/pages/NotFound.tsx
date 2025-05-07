
import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { playAudio } from '@/utils/audioUtils';

const NotFound = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  const handleBackHome = () => {
    playAudio('buttonClick');
    navigate('/');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-2xl text-gray-600 mb-8">
          {language === 'it' 
            ? 'Pagina non trovata'
            : 'Page not found'}
        </p>
        <Button 
          variant="default"
          size="lg"
          onClick={handleBackHome}
        >
          {language === 'it' ? 'Torna alla home' : 'Back to home'}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
