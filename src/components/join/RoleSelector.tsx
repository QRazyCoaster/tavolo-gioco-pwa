
import React from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/context/LanguageContext';
import { playAudio } from '@/utils/audioUtils';
import { UserRoundIcon, Users } from "lucide-react";

interface RoleSelectorProps {
  onSelectRole: (isHost: boolean) => void;
}

const RoleSelector = ({ onSelectRole }: RoleSelectorProps) => {
  const { t, language } = useLanguage();
  
  const handleRoleSelect = (isHost: boolean) => {
    console.log(`RoleSelector: Selected role - ${isHost ? 'Game Host' : 'Player'}`);
    try {
      playAudio('buttonClick');
    } catch (error) {
      console.error('Failed to play button click:', error);
    }
    
    onSelectRole(isHost);
  };
  
  return (
    <div className="w-full bg-white/80 backdrop-blur-sm rounded-lg p-6 mb-6">
      <h3 className="text-2xl font-semibold text-center mb-6">{t('common.chooseRole')}</h3>
      
      <div className="flex flex-col space-y-4">
        <Button 
          onClick={() => handleRoleSelect(true)}
          className="h-16 text-xl flex items-center justify-center gap-3"
        >
          <UserRoundIcon size={24} />
          {language === 'it' 
            ? 'Creatore Gioco (1° Narratore)' 
            : 'Game Host (First Narrator)'}
        </Button>
        
        <Button 
          onClick={() => handleRoleSelect(false)}
          variant="outline"
          className="h-16 text-xl flex items-center justify-center gap-3 bg-white/80"
        >
          <Users size={24} />
          {language === 'it' 
            ? 'Giocatore (Sarà Narratore in turni futuri)' 
            : 'Player (Will be Narrator in future rounds)'}
        </Button>
      </div>
    </div>
  );
};

export default RoleSelector;
