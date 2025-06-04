import { formatDistance } from "../utils/formatters.js";

export class StatsRenderer {
  constructor(domElements) {
    this.dom = domElements;
    this.playerName = "";
    this.timeFrame = "today";
  }

  setConfig(playerName, timeFrame) {
    this.playerName = playerName;
    this.timeFrame = timeFrame;
  }

  updateActiveLink() {
    if (this.dom.todayLink) {
      this.dom.todayLink.classList.toggle("active", this.timeFrame === "today");
    }
    if (this.dom.allTimeLink) {
      this.dom.allTimeLink.classList.toggle(
        "active",
        this.timeFrame === "allTime"
      );
    }
  }

  showNoData(show = true) {
    this.dom.contentWrapper.style.display = show ? "none" : "block";
    this.dom.noDataContainer.style.display = show ? "flex" : "none";
  }

  populateGeneralStats(stats) {
    this.dom.totalGamesEl.textContent = stats.totalGames ?? "0";
    this.dom.bestScoreEl.textContent = stats.bestScore ?? "-";
    this.dom.totalTimeEl.textContent = stats.totalTime ?? "-";
    this.dom.winCountEl.textContent = stats.wins ?? "0";
  }

  // populateWinLossChart(stats) {
  //   this.dom.winCountEl.textContent = stats.wins ?? "0";
  //   this.dom.lossCountEl.textContent = stats.losses ?? "0";

  //   const totalPlayed = stats.totalGames ?? 0;
  //   const radius = this.dom.winSegmentEl
  //     ? parseFloat(this.dom.winSegmentEl.getAttribute("r"))
  //     : 0;
  //   const circumference = 2 * Math.PI * radius;

  //   const winPercent = (stats.wins ?? 0) / totalPlayed;
  //   const lossPercent = (stats.losses ?? 0) / totalPlayed;

  //   const winSegmentLength = winPercent * circumference;
  //   const lossSegmentLength = lossPercent * circumference;

  //   this.dom.lossSegmentEl.style.strokeDasharray = `${lossSegmentLength} ${circumference}`;
  //   this.dom.lossSegmentEl.style.strokeDashoffset = "0";

  //   this.dom.winSegmentEl.style.strokeDasharray = `${winSegmentLength} ${circumference}`;
  //   this.dom.winSegmentEl.style.strokeDashoffset = `${-lossSegmentLength}`;

  //   if (winPercent === 1) {
  //     this.dom.lossSegmentEl.style.strokeDasharray = `0 ${circumference}`;
  //     this.dom.winSegmentEl.style.strokeDashoffset = "0";
  //   } else if (lossPercent === 1) {
  //     this.dom.winSegmentEl.style.strokeDasharray = `0 ${circumference}`;
  //   }
  // }

  populateLastGame(stats) {
    this.dom.lastMapNameEl.textContent =
      stats.actualLastMapName || "No name map";
    this.dom.lastMapHeaderEl.innerHTML = "";
    this.dom.lastMapTableBodyEl.innerHTML = "";

    const lastGames = stats.lastGamesOnMap || [];

    let headers = [];
    if (this.timeFrame === "today") {
      headers = ["Time", "Result", "Best Guess"];
    } else {
      headers = ["Date", "Result", "Best Guess"];
    }

    headers.forEach((headerText) => {
      const th = document.createElement("th");
      th.textContent = headerText;
      this.dom.lastMapHeaderEl.appendChild(th);
    });

    lastGames.forEach((game) => {
      const tr = document.createElement("tr");
      const formattedBestGuess = formatDistance(game.bestGuessDistance);
      let rowData = [];

      if (this.timeFrame === "today") {
        rowData = [game.time, game.result, formattedBestGuess];
      } else {
        rowData = [game.date, game.result, formattedBestGuess];
      }

      rowData.forEach((dataText) => {
        const td = document.createElement("td");
        td.textContent = dataText;
        tr.appendChild(td);
      });
      this.dom.lastMapTableBodyEl.appendChild(tr);
    });
  }
}
