/* …imports stay unchanged… */

export const useNarratorActions = (
  /* params unchanged */
) => {
  /* ─────────────────── award points ─────────────────── */
  const handleCorrectAnswer = useCallback((playerId: string) => {
    /* …all your existing code up to newScore… */

    const updatedPlayers = state.players.map(p =>
      p.id === playerId ? { ...p, score: newScore } : p
    );

    broadcastScoreUpdate(updatedPlayers);   // still send live bump

    /* clear this player from queue locally */
    setCurrentRound(prev => ({
      ...prev,
      playerAnswers: prev.playerAnswers.filter(a => a.playerId !== playerId)
    }));
    setShowPendingAnswers(false);

    /* advance */
    setTimeout(() => {
      const nextIdx = currentRound.currentQuestionIndex + 1;
      broadcastNextQuestion(nextIdx, updatedPlayers);     // ← fresh scores
      /* move narrator locally */
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: nextIdx,
        playerAnswers: [],
        timeLeft: 90
      }));
      setAnsweredPlayers(new Set());
    }, 300);
  },
  /* deps unchanged */);

  /* ─────────────────── deduct points ────────────────── */
  const handleWrongAnswer = useCallback((playerId: string) => {
    /* …unchanged through newScore… */

    const updatedPlayers = state.players.map(p =>
      p.id === playerId ? { ...p, score: newScore } : p
    );
    broadcastScoreUpdate(updatedPlayers);

    /* remove from queue */
    setCurrentRound(prev => ({
      ...prev,
      playerAnswers: prev.playerAnswers.filter(a => a.playerId !== playerId)
    }));
    setShowPendingAnswers(false);

    /* if nobody left -> next question */
    if (currentRound.playerAnswers.length <= 1) {
      const nextIdx = currentRound.currentQuestionIndex + 1;
      broadcastNextQuestion(nextIdx, updatedPlayers);     // ← fresh scores
      setCurrentRound(prev => ({
        ...prev,
        currentQuestionIndex: nextIdx,
        playerAnswers: [],
        timeLeft: 90
      }));
      setAnsweredPlayers(new Set());
    }
  },
  /* deps unchanged */);

  /* handleNextQuestion stays the same */
  return { handleCorrectAnswer, handleWrongAnswer, handleNextQuestion };
};
