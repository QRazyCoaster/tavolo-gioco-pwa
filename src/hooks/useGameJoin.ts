
import { useGameJoinCore } from './useGameJoinCore';
import { useHostJoin } from './useHostJoin';
import { usePlayerJoin } from './usePlayerJoin';

/**
 * Main hook for game joining functionality, combines core, host and player hooks
 */
export const useGameJoin = () => {
  const core = useGameJoinCore();
  const { handleHostNameSubmit } = useHostJoin();
  const { handlePlayerFormSubmit } = usePlayerJoin();
  
  return {
    pin: core.pin,
    name: core.name,
    isHost: core.isHost,
    loading: core.loading,
    showPinError: core.showPinError,
    handlePlayerRole: core.handlePlayerRole,
    handlePinChange: core.handlePinChange,
    handleNameChange: core.handleNameChange,
    handleHostNameSubmit,
    handlePlayerFormSubmit,
    handleBack: core.handleBack
  };
};
