
import React, { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import { supabase } from '@/supabaseClient';
import { Player } from '@/context/GameContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface WaitingRoomProps {
  onStartGame: () => void;
}

const WaitingRoom = ({ onStartGame }: WaitingRoomProps) => {
  const { t, language } = useLanguage();
  const { state, dispatch } = useGame();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isHost = state.currentPlayer?.isHost === true;

  useEffect(() => {
    if (!state.gameId) {
      console.log('[WaitingRoom] No gameId found, cannot subscribe to updates');
      return;
    }

    console.log(`[WaitingRoom] Setting up subscriptions for game ${state.gameId}`);

    // Fetch all players once
    supabase
      .from('players')
      .select('*')
      .eq('game_id', state.gameId)
      .then(({ data, error }) => {
        if (error) {
          console.error('[WaitingRoom] Error fetching players:', error);
          return;
        }
        if (!data) {
          console.log('[WaitingRoom] No player data received');
          return;
        }
        
        console.log(`[WaitingRoom] Fetched ${data.length} players`);
        const mapped = data.map(p => ({
          id: p.id,
          name: p.name,
          isHost: p.is_host === true,
          score: p.score || 0,
          buzzer_sound_url: p.buzzer_sound_url
        }));
        // Update current player if needed
        if (state.currentPlayer) {
          const updated = mapped.find(p => p.id === state.currentPlayer!.id);
          if (updated) {
            dispatch({ type: 'SET_CURRENT_PLAYER', payload: updated });
          }
        }
        dispatch({ type: 'ADD_PLAYER_LIST', payload: mapped });
      });

    // Subscribe to new players
    const playersChannel = supabase
      .channel(`players:${state.gameId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'players', filter: `game_id=eq.${state.gameId}` },
        payload => {
          console.log('[WaitingRoom] New player joined:', payload.new);
          const p: Player = {
            id: payload.new.id,
            name: payload.new.name,
            isHost: payload.new.is_host === true,
            score: payload.new.score || 0,
            buzzer_sound_url: payload.new.buzzer_sound_url
          };
          dispatch({ type: 'ADD_PLAYER', payload: p });
        }
      )
      .subscribe();

    // Subscribe to game updates - checking only 'status' field
    const gameChannel = supabase
      .channel(`game:${state.gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${state.gameId}` },
        payload => {
          console.log('[WaitingRoom] Game updated:', payload.new);
          
          // Check for active status only
          if (payload.new.status === 'active') {
            console.log('[WaitingRoom] Game started detected, redirecting all players');
            
            // Update local state
            dispatch({ type: 'START_GAME' });
            sessionStorage.setItem('gameStarted', 'true');
            
            if (payload.new.game_type) {
              dispatch({ type: 'SELECT_GAME', payload: payload.new.game_type });
              sessionStorage.setItem('selectedGame', payload.new.game_type);
            }
            
            // Notify user
            toast({
              title: language === 'it' ? "Il gioco sta iniziando" : "Game is starting",
              description: language === 'it' ? "Preparati a giocare!" : "Get ready to play!",
              duration: 5000,
            });
            
            // Play sound
            playAudio('success');
            
            // Redirect to appropriate page
            const gameType = payload.new.game_type || sessionStorage.getItem('selectedGame') || 'trivia';
            
            // Important: Add a small delay to ensure the toast is seen and the state is updated
            setTimeout(() => {
              if (gameType === 'trivia') {
                console.log('[WaitingRoom] Navigating to /trivia');
                navigate('/trivia');
              } else {
                console.log('[WaitingRoom] Navigating to /game');
                navigate('/game');
              }
            }, 1000);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[WaitingRoom] Cleaning up subscriptions');
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(gameChannel);
    };
  }, [state.gameId, dispatch, state.currentPlayer, navigate, toast, language]);

  const handleStartGame = () => {
    console.log('[WaitingRoom] Start game button clicked');
    playAudio('buttonClick');
    onStartGame();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <h2 className="text-3xl font-bold mb-4">{t('common.waitingForPlayers')}</h2>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 text-center">
        <span className="block text-lg font-semibold mb-1">{t('common.pin')}:</span>
        <span className="text-3xl font-bold tracking-wider">{state.pin}</span>
      </div>

      <Card className="w-full max-w-md p-4 mb-6">
        <h3 className="text-xl font-semibold mb-2">{t('common.players')}</h3>
        <ul className="space-y-2">
          {state.players.map(player => (
            <li
              key={player.id}
              className="p-3 bg-gray-50 rounded-md flex items-center justify-between"
            >
              <span className="text-lg">
                {player.name}
                {player.isHost && (
                  <span className="ml-2 text-sm bg-purple-400 text-white px-2 py-1 rounded-full">
                    {t('common.firstNarrator')}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {isHost ? (
        <Button
          className="w-full max-w-md h-14 text-xl"
          variant="default"
          onClick={handleStartGame}
          disabled={state.players.length < 2}
        >
          {t('common.startGame')}
        </Button>
      ) : (
        <div className="w-full max-w-md p-4 text-center">
          <p className="text-lg">{t('common.waitingForPlayersToJoin')}</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="w-3 h-3 bg-orange-300 rounded-full"></div>
              <div className="w-3 h-3 bg-orange-300 rounded-full"></div>
              <div className="w-3 h-3 bg-orange-300 rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingRoom;
