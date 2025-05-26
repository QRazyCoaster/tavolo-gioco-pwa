
import React from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/context/LanguageContext';
import { useGameJoin } from '@/hooks/useGameJoin';
import RoleSelector from '@/components/join/RoleSelector';
import HostPinDisplay from '@/components/join/HostPinDisplay';
import PlayerJoinForm from '@/components/join/PlayerJoinForm';
import MusicToggle from '@/components/MusicToggle';

const JoinGame = () => {
  const { language } = useLanguage();
  const {
    pin,
    name,
    isHost,
    loading,
    showPinError,
    handlePlayerRole,
    handlePinChange,
    handleNameChange,
    handleHostNameSubmit,
    handleHostNameChange,
    handlePlayerFormSubmit,
    handleBack
  } = useGameJoin();
  
  const renderContent = () => {
    if (isHost === null) {
      // Initial screen - choose role
      return <RoleSelector onSelectRole={handlePlayerRole} />;
    } else if (isHost && pin) {
      // Host - Show PIN and collect name
      return (
        <HostPinDisplay 
          pin={pin}
          name={name}
          loading={loading}
          onNameChange={handleHostNameChange}
          onSubmit={handleHostNameSubmit}
        />
      );
    } else if (!isHost) {
      // Player - Enter PIN and name together
      return (
        <PlayerJoinForm
          pin={pin}
          name={name}
          loading={loading}
          showPinError={showPinError}
          onPinChange={handlePinChange}
          onNameChange={handleNameChange}
          onSubmit={handlePlayerFormSubmit}
        />
      );
    } else {
      // Default state (shouldn't reach here)
      return null;
    }
  };
  
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundImage: `url('/lovable-uploads/3513380f-9e72-4df5-a6b6-1cdbe36f3f30.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="w-full flex justify-end mb-4">
          <MusicToggle className="bg-white/50 backdrop-blur-sm text-primary rounded-full" size="lg" />
        </div>
      
        {renderContent()}
        
        <div className="flex gap-4 mt-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="bg-white/80 backdrop-blur-sm"
            disabled={loading}
          >
            {language === 'it' ? 'Indietro' : 'Back'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JoinGame;
