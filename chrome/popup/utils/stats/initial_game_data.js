export function initialGameData(periodEvents) {
  const gameStartTimes = new Map();
  const gameOptionsMap = new Map();
  const gameFinishedTime = new Map();
  let lastGame = null;
  let startedGamesEvents = [];

  periodEvents.forEach((event) => {
    if (
      event.code === "LiveChallengeStarted" &&
      event.gameId &&
      event.timestamp
    ) {
      //gameStartTimes
      if (!gameStartTimes.has(event.gameId)) {
        const startTime = new Date(event.timestamp).getTime();
        if (!isNaN(startTime)) {
          gameStartTimes.set(event.gameId, startTime);
        }
      }
    }

    if (
      event.code === "LiveChallengeFinished" &&
      event.gameId &&
      event.timestamp
    ) {
      const gameId = event.gameId;
      const finishTime = new Date(event.timestamp).getTime();

      //gameFinishedTime
      if (!isNaN(finishTime)) {
        gameFinishedTime.set(gameId, finishTime);

        //lastGame
        if (!lastGame || finishTime > new Date(lastGame.timestamp).getTime()) {
          lastGame = event;
        }
      }
    }
  });

  //gameOptionsMap
  startedGamesEvents = periodEvents.filter(
    (e) => e.code === "LiveChallengeStarted" && gameFinishedTime.has(e.gameId)
  );

  startedGamesEvents.forEach((event_inner) => {
    const gameId = event_inner.gameId;
    const state = event_inner.liveChallenge?.state;

    if (state) {
      gameOptionsMap.set(gameId, state);
    }
  });

  return {
    gameStartTimes,
    gameFinishedTime,
    lastGame,
    gameOptionsMap,
    startedGamesEvents,
  };
}
