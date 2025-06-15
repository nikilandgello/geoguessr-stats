import { getCurrentPlayerName, getEvents } from "./utils/db.js";
import { StatsCalculator } from "./utils/stats/calculator.js";
import { StatsRenderer } from "./ui/stats_renderer.js";
import { displayGlobalErrorUI } from "./ui/error_display.js";

function setLoadingState(isLoading) {
  const loadingOverlayEl = document.getElementById("loading-overlay");
  const contentWrapperEl = document.getElementById("content-wrapper");
  const noDataContainerEl = document.getElementById("no-data");

  if (isLoading) {
    loadingOverlayEl.style.display = "flex";
    contentWrapperEl.style.display = "none";
    noDataContainerEl.style.display = "none";
  }

  if (!isLoading) {
    loadingOverlayEl.style.display = "none";
  }
}

class PopupApp {
  constructor(initialEvents, currentPlayerNick) {
    this.events = initialEvents || [];
    this.timeFrame = "today";
    this.currentPlayerNick = currentPlayerNick || null;

    this.dom = {
      contentWrapper: document.getElementById("content-wrapper"),
      noDataContainer: document.getElementById("no-data"),
      todayLink: document.getElementById("today-link"),
      allTimeLink: document.getElementById("all-time-link"),
      totalGamesEl: document.getElementById("total-games"),
      bestScoreEl: document.getElementById("best-score"),
      totalTimeEl: document.getElementById("total-time"),
      winCountEl: document.getElementById("win-count"),
      winStreakEl: document.getElementById("win-streak"),
      fireIconEl: document.getElementById("fire-icon"),
      lastMapNameEl: document.getElementById("last-map-name"),
      lastMapHeaderEl: document.getElementById("last-map-header"),
      lastMapTableBodyEl: document.getElementById("last-map-table-body"),
    };

    for (const key in this.dom) {
      if (!this.dom[key]) {
        console.error(
          `PopupApp: Element '${key}' not found! Check HTML structure.`
        );
      }
    }

    this.statsCalculator = new StatsCalculator(this.currentPlayerNick);
    this.statsRenderer = new StatsRenderer(this.dom);

    this.addEventListeners();
    this.update();
  }

  addEventListeners() {
    if (this.dom.todayLink) {
      this.dom.todayLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (this.timeFrame !== "today") {
          this.timeFrame = "today";
          this.update();
        }
      });
    }
    if (this.dom.allTimeLink) {
      this.dom.allTimeLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (this.timeFrame !== "allTime") {
          this.timeFrame = "allTime";
          this.update();
        }
      });
    }
  }

  update() {
    try {
      const statsData = this.statsCalculator.calculate(
        this.events,
        this.timeFrame
      );

      this.statsRenderer.setConfig(this.currentPlayerNick, this.timeFrame);

      this.statsRenderer.populateGeneralStats(statsData);
      this.statsRenderer.populateLastGame(statsData);
      this.statsRenderer.updateActiveLink();

      if (statsData.totalGames === 0) {
        this.statsRenderer.showNoData(true);
      } else {
        this.statsRenderer.showNoData(false);
      }
    } catch (error) {
      console.error("PopupApp: Error during stats update:", error);
      this.statsRenderer.setConfig(this.currentPlayerNick, this.timeFrame);
      displayGlobalErrorUI(
        "Error loading stats. <br/> Please try again later."
      );
    }
  }
}

async function initializePopup() {
  setLoadingState(true);
  try {
    const events = await getEvents();
    const playerNick = await getCurrentPlayerName(events);
    new PopupApp(events, playerNick);
  } catch (error) {
    console.error(
      "initializePopup: Failed to initialize popup due to an error:",
      error
    );
    setLoadingState(false);
    displayGlobalErrorUI();
  } finally {
    setLoadingState(false);
  }
}

document.addEventListener("DOMContentLoaded", initializePopup);
