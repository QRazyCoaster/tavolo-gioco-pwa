
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { checkAndFixBuzzer } from '@/utils/playerUtils';
import { supabase } from '@/supabaseClient';
import { useGame } from '@/context/GameContext';

interface BuzzerFixButtonProps {
  fixAttempted: boolean;
  setFixAttempted: React.Dispatch<React.SetStateAction<boolean>>;
}

const BuzzerFixButton = ({ fixAttempted, setFixAttempted }: BuzzerFixButtonProps) => {
  const { state, dispatch } = useGame();
  const { toast } = useToast();
  const [isFixing, setIsFixing] = useState(false);

  const handleFixBuzzer = async () => {
    if (isFixing) return;
    
    setIsFixing(true);
    setFixAttempted(true);
    
    if (!state.currentPlayer) {
      toast({
        title: "Buzzer Update Failed",
        description: "No player data available. Please try rejoining the game.",
        variant: "destructive",
      });
      setIsFixing(false);
      return;
    }
    
    try {
      const result = await checkAndFixBuzzer(
        supabase, 
        state.currentPlayer,
        (updatedPlayer: any) => dispatch({ type: 'SET_CURRENT_PLAYER', payload: updatedPlayer })
      );
      
      if (result && result.success) {
        toast({
          title: "Buzzer Update",
          description: "Successfully fixed buzzer sound!",
        });
      } else {
        toast({
          title: "Buzzer Update Failed",
          description: "Could not assign buzzer sound. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[BuzzerFixButton] Error fixing buzzer:', error);
      toast({
        title: "Buzzer Update Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <h3 className="font-semibold">Buzzer Troubleshooting:</h3>
      <p className="text-sm mb-2">
        If your buzzer is not working, try the button below to force assignment.
      </p>
      <Button 
        variant="secondary" 
        size="sm" 
        onClick={handleFixBuzzer}
        className="w-full"
        disabled={isFixing}
      >
        {isFixing ? 'Fixing...' : 'Fix My Buzzer'}
      </Button>
      <p className="text-xs mt-2">
        Status: {fixAttempted ? 'Fix attempted' : 'No fix attempted yet'}
      </p>
    </div>
  );
};

export default BuzzerFixButton;
