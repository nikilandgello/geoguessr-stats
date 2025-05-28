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

  for (const gameId of finishedGameIds) {
    const gameData = gameScoresData.get(gameId);

    playerTotalGames++;

    //playerTotalTimeMs
    const startTime = gameStartTimes.get(gameId);
    const finishTime = gameFinishedTime.get(gameId);
    if (startTime && finishTime) {
      if (!isNaN(startTime) && !isNaN(finishTime)) {
        const duration = finishTime - startTime;
        if (duration > 0) playerTotalTimeMs += duration;
      }
    }

    //Win or Loss
    const playerScoreData = gameData.get(currentPlayerName);
    let playerScore = playerScoreData?.totalScore;

    let isPlayerWinnerInThisGame = true;

    for (const [otherPlayer, otherPlayerData] of gameData.entries()) {
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
    } else {
      playerLosses++;
      playerScoreData.result = "Loss";
    }
  }

  return { playerWins, playerLosses, playerTotalGames, playerTotalTimeMs };
}
