
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import { Book, BookText, Wine } from "lucide-react";
import MusicToggle from '@/components/MusicToggle';

const RulesPage = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { state } = useGame();
  
  const handleContinue = () => {
    playAudio('buttonClick');
    navigate('/join');
  };
  
  const handleBack = () => {
    playAudio('buttonClick');
    navigate('/games');
  };
  
  const renderGameRules = () => {
    switch (state.selectedGame) {
      case 'trivia':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BookText size={24} className="text-primary" />
              <h3 className="text-xl font-semibold">{t('games.trivia')}</h3>
            </div>
            <ul className="list-disc pl-5 space-y-2">
              {language === 'it' ? (
                <>
                  <li>Un giocatore è il narratore e legge le domande.</li>
                  <li>Il narratore legge la domanda ad alta voce.</li>
                  <li>Gli altri giocatori competono per rispondere per primi.</li>
                  <li>Premere il pulsante buzzer quando si conosce la risposta.</li>
                  <li>Il primo giocatore a premere il buzzer può rispondere.</li>
                  <li>Un punto per ogni risposta corretta.</li>
                  <li>Nessun punto per le risposte sbagliate.</li>
                  <li className="font-semibold mt-4">Cambio di turno:</li>
                  <li>Il ruolo del narratore passa al giocatore successivo dopo 5 domande.</li>
                  <li>Il gioco continua finché tutti hanno avuto il turno come narratore.</li>
                </>
              ) : (
                <>
                  <li>One player is the narrator and reads the questions.</li>
                  <li>The narrator reads the question aloud.</li>
                  <li>Other players compete to answer first.</li>
                  <li>Press the buzzer button when you know the answer.</li>
                  <li>The first player to hit the buzzer gets to answer.</li>
                  <li>One point for each correct answer.</li>
                  <li>No points for incorrect answers.</li>
                  <li className="font-semibold mt-4">Turn Rotation:</li>
                  <li>The narrator role passes to the next player after 5 questions.</li>
                  <li>The game continues until everyone has had a turn as narrator.</li>
                </>
              )}
            </ul>
          </div>
        );
      case 'bottlegame':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Wine size={24} className="text-primary" />
              <h3 className="text-xl font-semibold">{t('games.bottleGame')}</h3>
            </div>
            <ul className="list-disc pl-5 space-y-2">
              {language === 'it' ? (
                <>
                  <li>I giocatori si siedono in cerchio attorno al dispositivo.</li>
                  <li>Un giocatore preme il pulsante per far girare la bottiglia virtuale.</li>
                  <li>Quando la bottiglia si ferma, indica un giocatore.</li>
                  <li>Il giocatore indicato deve eseguire un'azione o rispondere a una domanda.</li>
                </>
              ) : (
                <>
                  <li>Players sit in a circle around the device.</li>
                  <li>One player presses the button to spin the virtual bottle.</li>
                  <li>When the bottle stops, it points to a player.</li>
                  <li>The player pointed at must perform an action or answer a question.</li>
                </>
              )}
            </ul>
          </div>
        );
      default:
        return (
          <div className="text-center p-4">
            <p>{t('common.noGameSelected')}</p>
          </div>
        );
    }
  };
  
  if (!state.selectedGame) {
    navigate('/games');
    return null;
  }
  
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
        <div className="text-center mb-8 w-full flex justify-between items-center">
          {/* Removed common.gameRules text here */}
          <div className="w-1/3"></div> {/* Empty div for layout balance */}
          <MusicToggle className="bg-white/50 backdrop-blur-sm text-primary rounded-full" />
        </div>
        
        <Card className="w-full bg-white/90 backdrop-blur-sm p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <Book size={28} className="text-primary mr-2" />
            <h3 className="text-xl font-semibold">{t('common.rules')}</h3>
          </div>
          
          {renderGameRules()}
        </Card>
        
        <div className="flex gap-4 mt-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="bg-white/80 backdrop-blur-sm"
          >
            {t('common.back')}
          </Button>
          
          <Button 
            onClick={handleContinue}
            className="bg-primary text-white"
          >
            {t('common.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RulesPage;
