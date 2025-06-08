export function playerGameActivity(
  finishedGameIds,
  gameScoresData,
  gameStartTimes,
  gameFinishedTime,
  currentPlayerName
) {
  let playerWins = 0;
  let playerLosses = 0;
  let playerTotalGames = 0;
  let playerTotalTimeMs = 0;
  let playerWinStreak = 0;

  const playerGameIds = Array.from(finishedGameIds).filter(
    (gameId) =>
      gameScoresData.has(gameId) &&
      gameScoresData.get(gameId).has(currentPlayerName)
  );

  playerGameIds.sort((a, b) => {
    const timeA = gameFinishedTime.get(a) || 0;
    const timeB = gameFinishedTime.get(b) || 0;
    return timeB - timeA;
  });

  let currentStreakActive = true;

  for (const gameId of playerGameIds) {
    playerTotalGames++;

    const gameAllScores = gameScoresData.get(gameId);
    const playerScoreData = gameAllScores.get(currentPlayerName);

    const startTime = gameStartTimes.get(gameId);
    const finishTime = gameFinishedTime.get(gameId);
    if (startTime && finishTime && !isNaN(startTime) && !isNaN(finishTime)) {
      const duration = finishTime - startTime;
      if (duration > 0) {
        playerTotalTimeMs += duration;
      }
    }

    if (playerScoreData) {
      const playerScore = playerScoreData.totalScore;
      let isPlayerWinnerInThisGame = true;

      for (const [otherPlayer, otherPlayerData] of gameAllScores.entries()) {
        if (otherPlayer !== currentPlayerName) {
          if (otherPlayerData.totalScore > playerScore) {
            isPlayerWinnerInThisGame = false;
            break;
          }
        }
      }

      if (isPlayerWinnerInThisGame) {
        playerWins++;
        playerScoreData.result = "Win";
        if (currentStreakActive) {
          playerWinStreak++;
        }
      } else {
        playerLosses++;
        playerScoreData.result = "Loss";
        currentStreakActive = false;
      }
    } else {
      currentStreakActive = false;
    }
  }

  return {
    playerWins,
    playerLosses,
    playerTotalGames,
    playerTotalTimeMs,
    playerWinStreak,
  };
}
