import { useGameJoinCore } from './useGameJoinCore';
import { useHostJoin } from './useHostJoin';
import { usePlayerJoin } from './usePlayerJoin';

/**
 * Main hook for game‑joining functionality
 * – creates ONE core instance
 * – passes that same instance into the host‑ and player‑specific hooks
 */
export const useGameJoin = () => {
  const core = useGameJoinCore();

  // role‑specific helpers, fed with the same core
  const { handleHostNameSubmit, handleHostNameChange } = useHostJoin(core);
  const { handlePlayerFormSubmit } = usePlayerJoin(core);

  return {
    ...core,                   // pin, name, loading, etc.
    handleHostNameChange,
    handleHostNameSubmit,
    handlePlayerFormSubmit
  };
};
