
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage, Language } from '@/context/LanguageContext';

const LanguageSelector = () => {
  const { setLanguage, t } = useLanguage();

  const handleChangeLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <h2 className="text-3xl font-bold mb-6">{t('common.chooseLanguage')}</h2>
      <div className="flex flex-col space-y-4 w-full max-w-sm">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => handleChangeLanguage('en')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🇬🇧</span>
              <span className="text-xl font-semibold">English</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleChangeLanguage('en')}>
              Select
            </Button>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => handleChangeLanguage('it')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🇮🇹</span>
              <span className="text-xl font-semibold">Italiano</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleChangeLanguage('it')}>
              Seleziona
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LanguageSelector;
