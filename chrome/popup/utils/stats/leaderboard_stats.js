export function leaderboardStats(leaderboardEvents, currentPlayerName) {
  const gameScoresData = new Map();
  let playerBestScore = 0;

  leaderboardEvents.forEach((event) => {
    const gameId = event.gameId;
    const gameEntries = event.liveChallenge?.leaderboards?.game?.entries;
    const roundEntries = event.liveChallenge?.leaderboards?.round?.entries;
    const roundGuesses = event.liveChallenge?.leaderboards?.round?.guesses;

    if (!gameScoresData.has(gameId)) {
      gameScoresData.set(gameId, new Map());
    }
    const currentGameScores = gameScoresData.get(gameId);

    //total score
    if (gameEntries) {
      gameEntries.forEach((player) => {
        const playerName = player.name;
        let finalScore;
        if (player.score === undefined) {
          finalScore = 0;
        }
        finalScore = player.score ?? 0;

        if (!currentGameScores.has(playerName)) {
          currentGameScores.set(playerName, {
            totalScore: 0,
            bestGuessDistance: Infinity,
          });
        }

        const playerGameData = currentGameScores.get(playerName);
        playerGameData.totalScore = finalScore;

        if (playerName === currentPlayerName) {
          playerBestScore = Math.max(playerBestScore, finalScore);

          if (!playerGameData.hasOwnProperty("result")) {
            playerGameData.result = "-";
          }
        }
      });
    }

    //buest distance
    if (
      roundEntries &&
      roundGuesses &&
      roundEntries.length === roundGuesses.length
    ) {
      for (let i = 0; i < roundEntries.length; i++) {
        const player = roundEntries[i];
        const playerName = player.name;
        const guess = roundGuesses[i];

        if (!currentGameScores.has(playerName)) {
          currentGameScores.set(playerName, {
            totalScore: 0,
            bestGuessDistance: Infinity,
          });
        }
        const playerGameData = currentGameScores.get(playerName);

        if (
          guess &&
          typeof guess.distance === "number" &&
          guess.distance >= 0
        ) {
          playerGameData.bestGuessDistance = Math.min(
            playerGameData.bestGuessDistance,
            guess.distance
          );
        }
      }
    }
  });

  return {
    gameScoresData,
    playerBestScore,
  };
}
