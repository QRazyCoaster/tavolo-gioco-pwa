
import React, { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/context/LanguageContext';
import { useGame } from '@/context/GameContext';
import { playAudio } from '@/utils/audioUtils';
import { supabase } from '@/supabaseClient';
import { Player } from '@/context/GameContext'; // Import Player type

interface WaitingRoomProps {
  onStartGame: () => void;
}

const WaitingRoom = ({ onStartGame }: WaitingRoomProps) => {
  const { t } = useLanguage();
  const { state, dispatch } = useGame();
  
  // Let's make sure we correctly identify if current player is the host
  const isHost = state.currentPlayer?.isHost === true;

  /* ───────────── fetch + realtime players ───────────── */
  useEffect(() => {
    if (!state.gameId) return;

    // fetch iniziale di tutti i giocatori
    supabase
      .from('players')
      .select('*')
      .eq('game_id', state.gameId)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching players:', error);
          return;
        }
        
        console.log('Raw players data from DB:', data);
        
        if (data) {
          const mappedPlayers = data.map(player => {
            console.log(`Player ${player.name} buzzer URL: ${player.buzzer_sound_url}`);
            
            return {
              id: player.id,
              name: player.name,
              isHost: player.is_host === true, // Conversione esplicita a boolean
              score: player.score || 0,
              buzzer_sound_url: player.buzzer_sound_url
            };
          });
          
          // Aggiorna il giocatore corrente se è nell'elenco
          if (state.currentPlayer) {
            const updatedCurrentPlayer = mappedPlayers.find(p => p.id === state.currentPlayer?.id);
            if (updatedCurrentPlayer) {
              console.log('Updated current player:', updatedCurrentPlayer);
              dispatch({ type: 'SET_CURRENT_PLAYER', payload: updatedCurrentPlayer });
            }
          }
          
          dispatch({ type: 'ADD_PLAYER_LIST', payload: mappedPlayers });
        }
      });

    // subscribe agli INSERT in tempo reale
    const channel = supabase
      .channel('players:' + state.gameId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'players', filter: `game_id=eq.${state.gameId}` },
        payload => {
          console.log('New player joined:', payload.new);
          // Cast the payload.new to match the Player type
          const newPlayer: Player = {
            id: payload.new.id,
            name: payload.new.name,
            isHost: payload.new.is_host === true, // Conversione esplicita a boolean
            score: payload.new.score || 0,
            buzzer_sound_url: payload.new.buzzer_sound_url
          };
          dispatch({ type: 'ADD_PLAYER', payload: newPlayer });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.gameId, dispatch, state.currentPlayer]);
  /* ──────────────────────────────────────────────────── */

  const handleStartGame = () => {
    playAudio('buttonClick');
    onStartGame();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <h2 className="text-3xl font-bold mb-4">{t('common.waitingForPlayers')}</h2>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 text-center">
        <span className="block text-lg font-semibold mb-1">{t('common.pin')}: </span>
        <span className="text-3xl font-bold tracking-wider">{state.pin}</span>
      </div>

      {/* Debug information section */}
      <div className="w-full mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-semibold mb-1">Debug Info:</h3>
        <p className="text-xs">Current player ID: {state.currentPlayer?.id || 'None'}</p>
        <p className="text-xs">Current player buzzer: {state.currentPlayer?.buzzer_sound_url || 'None'}</p>
        <p className="text-xs">Game ID: {state.gameId}</p>
      </div>

      <Card className="w-full max-w-md p-4 mb-6">
        <h3 className="text-xl font-semibold mb-2">{t('common.players')}</h3>
        <ul className="space-y-2">
          {state.players.map((player) => (
            <li
              key={player.id}
              className="p-3 bg-gray-50 rounded-md flex items-center justify-between"
            >
              <div className="flex flex-col">
                <span className="text-lg">
                  {player.name}
                  {player.isHost && (
                    <span className="ml-2 text-sm bg-purple-400 text-white px-2 py-1 rounded-full">
                      {t('common.firstNarrator')}
                    </span>
                  )}
                </span>
                {/* Show buzzer URL status - for debugging */}
                <span className="text-xs text-gray-500">
                  Buzzer: {player.buzzer_sound_url ? '✅' : '❌'}
                </span>
              </div>
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
