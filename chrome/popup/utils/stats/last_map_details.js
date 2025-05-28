import { getMapName } from "../map_names.js";

export function lastMapDetails(
  lastGame,
  gameOptionsMap,
  startedGamesEvents,
  gameScoresData,
  currentPlayerName
) {
  let lastGamesOnMapDetails = [];
  let actualLastMapName = "";

  if (!lastGame) {
    return { lastGamesOnMapDetails, actualLastMapName };
  }

  const lastGameOptions = gameOptionsMap.get(lastGame.gameId);

  const lastMapSlug = lastGameOptions?.options?.mapSlug;
  const lastMapName = lastGameOptions?.mapName;

  if (lastMapSlug || lastMapName) {
    const gamesOnThisMapEvents = startedGamesEvents
      .filter((event) => {
        const gameOpts = gameOptionsMap.get(event.gameId);
        const currentMapSlug = gameOpts?.options?.mapSlug;
        const currentMapName = gameOpts.mapName;
        const slugMatch = lastMapSlug && currentMapSlug === lastMapSlug;
        const nameMatch = lastMapName && currentMapName === lastMapName;

        return slugMatch || nameMatch;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    if (gamesOnThisMapEvents.length > 0) {
      const gameEventForMapName = gamesOnThisMapEvents[0];
      actualLastMapName = getMapName(gameEventForMapName);
    }

    for (const gameEvent of gamesOnThisMapEvents.slice(0, 2)) {
      const gameId = gameEvent.gameId;
      const gameTimestamp = new Date(gameEvent.timestamp);

      const gameDataForPlayer = gameScoresData
        .get(gameId)
        ?.get(currentPlayerName);

      let playerScore = 0;
      let playerBestGuessInThisGame = Infinity;
      let resultText = "-";

      if (gameDataForPlayer) {
        playerScore = gameDataForPlayer.totalScore;
        playerBestGuessInThisGame = gameDataForPlayer.bestGuessDistance;
        resultText = gameDataForPlayer.result;
      }

      lastGamesOnMapDetails.push({
        date: gameTimestamp.toLocaleDateString(),
        time: gameTimestamp.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        result: resultText,
        score: playerScore,
        bestGuessDistance: playerBestGuessInThisGame,
      });
    }
  }

  return { lastGamesOnMapDetails, actualLastMapName };
}
