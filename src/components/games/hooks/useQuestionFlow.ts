
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { playAudio } from '@/utils/audioUtils';
import { TriviaQuestionType } from '../types/triviaTypes';

export const useQuestionFlow = () => {
  const { toast } = useToast();
  const { language } = useLanguage();
  
  // Reveal answer to narrator
  const handleRevealAnswer = (setShowAnswer: React.Dispatch<React.SetStateAction<boolean>>) => {
    setShowAnswer(true);
    playAudio('notification');
  };
  
  // Show question to all players
  const handleShowQuestion = (
    setWaitingForNarrator: React.Dispatch<React.SetStateAction<boolean>>,
    setQueuedPlayers: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
    setWaitingForNarrator(false);
    playAudio('notification');
    
    setQueuedPlayers([]);
    
    toast({
      title: language === 'it' ? "Nuova domanda" : "New question",
      description: language === 'it' 
        ? "Il narratore ha mostrato una nuova domanda" 
        : "The narrator has revealed a new question"
    });
  };
  
  // Move to next question
  const handleNextQuestion = (
    currentQuestionIndex: number,
    questions: TriviaQuestionType[],
    setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>,
    roundNumber: number,
    setRoundNumber: React.Dispatch<React.SetStateAction<number>>,
    setShowAnswer: React.Dispatch<React.SetStateAction<boolean>>,
    setQueuedPlayers: React.Dispatch<React.SetStateAction<any[]>>,
    setWaitingForNarrator: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setShowAnswer(false);
    setQueuedPlayers([]);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentQuestionIndex(0);
      setRoundNumber(roundNumber + 1);
    }
    
    setWaitingForNarrator(true);
    
    toast({
      title: language === 'it' ? "Prossima domanda" : "Next question",
      description: language === 'it' 
        ? "Passiamo alla prossima domanda" 
        : "Moving to the next question"
    });

    setTimeout(() => {
      setWaitingForNarrator(false);
    }, 500);
  };
  
  return {
    handleRevealAnswer,
    handleShowQuestion,
    handleNextQuestion
  };
};
