import { filterEventsByPeriod } from "./event_filters.js";
import { initialGameData } from "./initial_game_data.js";
import { leaderboardStats } from "./leaderboard_stats.js";
import { playerGameActivity } from "./player_game_activity.js";
import { lastMapDetails } from "./last_map_details.js";
import { formatDurationMs } from "../formatters.js";

export class StatsCalculator {
  constructor(playerName) {
    this.playerName = playerName;
  }

  calculate(events, timeFrame) {
    if (events.length === 0 || !this.playerName) {
      return {
        totalGames: 0,
        bestScore: "-",
        totalTime: "-",
        wins: 0,
        losses: 0,
        winStreak: 0,
        lastGamesOnMap: [],
        actualLastMapName: "-",
      };
    }

    const currentPlayerName = this.playerName;
    const periodEvents = filterEventsByPeriod(events, timeFrame);

    //inital data
    const {
      gameStartTimes,
      gameFinishedTime,
      lastGame,
      gameOptionsMap,
      startedGamesEvents,
    } = initialGameData(periodEvents);

    // filter events for leaderboard updates if the game is finished
    const leaderboardEvents = periodEvents.filter(
      (e) =>
        e.code === "LiveChallengeLeaderboardUpdate" &&
        gameFinishedTime.has(e.gameId)
    );
    const finishedGameIds = new Set(leaderboardEvents.map((e) => e.gameId));

    //bestScore
    const { gameScoresData, playerBestScore } = leaderboardStats(
      leaderboardEvents,
      currentPlayerName
    );

    //totalGames, totalTime, wins, losses, winStreak
    const {
      playerWins,
      playerLosses,
      playerTotalGames,
      playerTotalTimeMs,
      playerWinStreak,
    } = playerGameActivity(
      finishedGameIds,
      gameScoresData,
      gameStartTimes,
      gameFinishedTime,
      currentPlayerName
    );

    //lastGamesOnMap, actualLastMapName
    const { lastGamesOnMapDetails, actualLastMapName } = lastMapDetails(
      lastGame,
      gameOptionsMap,
      startedGamesEvents,
      gameScoresData,
      currentPlayerName
    );

    const formattedTotalTimePlayer = formatDurationMs(playerTotalTimeMs);

    console.log("calculae: lastGamesOnMapDetails", lastGamesOnMapDetails);
    console.log("calculate: gameScoresData", gameScoresData);

    return {
      totalGames: playerTotalGames,
      bestScore: playerBestScore,
      totalTime: formattedTotalTimePlayer,
      wins: playerWins,
      losses: playerLosses,
      winStreak: playerWinStreak,
      lastGamesOnMap: lastGamesOnMapDetails,
      actualLastMapName,
    };
  }
}
