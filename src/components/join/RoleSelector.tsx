
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
    // Play sound first, then perform action
    console.log(`[RoleSelector] Playing button click sound and selecting role: ${isHost ? 'host' : 'player'}`);
    const audio = playAudio('buttonClick');
    
    // Ensure audio plays before proceeding with action
    setTimeout(() => {
      onSelectRole(isHost);
    }, 50);
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
          {language === 'it' ? '1° narratore' : 'First Host'}
        </Button>
        
        <Button 
          onClick={() => handleRoleSelect(false)}
          variant="outline"
          className="h-16 text-xl flex items-center justify-center gap-3 bg-white/80"
        >
          <Users size={24} />
          {language === 'it' ? 'Gli altri giocatori' : 'Other Players'}
        </Button>
      </div>
    </div>
  );
};

export default RoleSelector;
