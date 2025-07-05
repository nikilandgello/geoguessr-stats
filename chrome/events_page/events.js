let db;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    let dbRequest = indexedDB.open("GeoGuessrStats", 1);

    dbRequest.onupgradeneeded = function (event) {
      console.log("Database upgrade needed");
      db = event.target.result;
      if (!db.objectStoreNames.contains("Events")) {
        db.createObjectStore("Events", { keyPath: "_id", autoIncrement: true });
        console.log("Object store 'Events' created");
      }
    };

    dbRequest.onsuccess = function (event) {
      console.log("Database opened successfully");
      db = event.target.result;
      resolve(db);
    };

    dbRequest.onerror = function (event) {
      console.error("Database error: " + event.target.error);
      reject("Database error");
    };
  });
}

async function getEvents() {
  try {
    await openDB();
    return new Promise((resolve, reject) => {
      let transaction = db.transaction(["Events"], "readonly");
      let store = transaction.objectStore("Events");
      let request = store.getAll();

      request.onsuccess = function (event) {
        let records = event.target.result;

        resolve(records);
      };

      request.onerror = function (event) {
        reject("Error getting all data");
      };
    });
  } catch (error) {
    console.error("Error in getEvents:", error);
  }
}

async function importData(file) {
  const content = await file.text();
  const events = content
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map(JSON.parse);

  try {
    await openDB();
    const transaction = db.transaction(["Events"], "readwrite");
    const store = transaction.objectStore("Events");

    const clearRequest = store.clear();

    await new Promise((resolve, reject) => {
      clearRequest.onsuccess = () => {
        console.log("Events store cleared successfully");
        resolve();
      };
      clearRequest.onerror = (event) => {
        console.error("Error clearing Events store:", event.target.error);
        reject("Error clearing Events store");
      };
    });

    for (const event of events) {
      await store.add(event);
    }

    await new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log("All events imported successfully");
        resolve();
      };
      transaction.onerror = (event) => {
        console.error("Error importing events:", event.target.error);
        reject("Error importing events");
      };
    });
  } catch (error) {
    console.error("Error importing data:", error);
    throw error;
  }
}

function removeOptions(selectElement) {
  var i,
    L = selectElement.options.length - 1;
  for (i = L; i >= 0; i--) {
    selectElement.remove(i);
  }
}

function setLoadingState(isLoading) {
  const loadingOverlayEl = document.getElementById("loading-overlay");
  const contentWrapperEl = document.getElementById("content-wrapper");

  if (isLoading) {
    contentWrapperEl.style.display = "none";
    loadingOverlayEl.style.display = "flex";
  }

  if (!isLoading) {
    loadingOverlayEl.style.display = "none";
    contentWrapperEl.style.display = "block";
  }
}

function showToast(text, type = "success", callback) {
  const options = {
    text: text,
    duration: 3000,
    gravity: "top",
    position: "center",
    stopOnFocus: true,
    callback: callback,
    close: true,
  };

  if (type === "success") {
    options.backgroundColor = "linear-gradient(to right, #00b09b, #96c93d)";
  } else if (type === "error") {
    options.backgroundColor = "linear-gradient(to right, #ff5f6d, #ffc371)";
    options.duration = 5000;
  }

  Toastify(options).showToast();
}

class Stats {
  constructor(events) {
    this.events = events;
    this.filteredEvents = [];

    this.allGameScores = [];
    this.scoresPerPage = 10;
    this.currentPage = 1;

    this.timeFrame = "allTime";
    this.dateRange = [];
    this.map = "All";
    this.player = "All";
    this.roundCount = 5;
    this.roundTime = 90;
    this.movingAllowed = true;
    this.panningAllowed = true;
    this.zoomingAllowed = true;
    this.anyOptions = true;
    this.anyRoundCount = true;
    this.anyRoundTime = true;

    this.addFilterEventListeners();
    this.addEventListeners();
    this.initDatepicker(); 
    this.update();
  }

  update() {
    this.gameOptions = this.getGameOptions();

    var maps = new Set();
    for (let game of Object.entries(this.gameOptions)) {
      maps.add(game[1].mapSlug);
    }
    this.addMapsSelectOptions(maps);

    this.players = this.getPlayers();
    this.addPlayersSelectOptions();

    this.populateTopScore();
    console.log("Updated");
  }

  getGameOptions() {
    var roundEvents = this.events.filter(
      (event) => event.code == "LiveChallengeLeaderboardUpdate"
    );
    var gameRoundsMap = new Map();
    for (var event of roundEvents) {
      if (!(event.gameId in gameRoundsMap)) gameRoundsMap[event.gameId] = 1;
      else gameRoundsMap[event.gameId] += 1;
    }

    var filteredEvents = this.events.filter(
      (event) => event.code == "LiveChallengeFinished"
    );
    var gameOptions = new Map();
    for (var event of filteredEvents) {
      event.liveChallenge.state.options["date"] = new Date(event.timestamp);
      if (event.gameId in gameRoundsMap)
        gameOptions[event.gameId] = event.liveChallenge.state.options;
    }
    console.log("Game options loaded", gameOptions);
    return gameOptions;
  }

  addFilterEventListeners() {
    let filters = [
      "roundCount",
      "roundTime",
      "movingAllowed",
      "panningAllowed",
      "zoomingAllowed",
      "anyOptions",
      "anyRoundCount",
      "anyRoundTime",
    ];
    filters.forEach((element) => {
      document.getElementById(element).addEventListener("change", (e) => {
        this[element] =
          e.target.value != "on" ? e.target.value : e.target.checked;
        this.populateTopScore();
      });
    });

    const timeFrameSelect = document.getElementById("timeFrame");
    const dateRangeFilter = document.getElementById("dateRangeFilter");

    timeFrameSelect.addEventListener("change", (e) => {
      this.timeFrame = e.target.value;
    
      if (this.timeFrame === "customRange") {
        dateRangeFilter.style.display = "block";
        
      } else {
        dateRangeFilter.style.display = 'none';
        this.populateTopScore();
      }
    })
  }

  addEventListeners() {
    document.getElementById("exportButton").addEventListener("click", (_) => {
      this.exportToJsonl();
    });
    document.getElementById("importButton").addEventListener("click", (_) => {
      document.getElementById("importFileInput").click();
      this.handleImport;
    });

    document
      .getElementById("importFileInput")
      .addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          this.handleImport(file);
        }
      });

    document.getElementById("loadMoreButton").addEventListener("click", () => {
      this.currentPage++;
      this.displayScores();
    });

    document.getElementById("anyOptions").addEventListener("change", (e) => {
      let otherOptions = [
        "movingAllowed",
        "panningAllowed",
        "zoomingAllowed",
        "movingAllowedLabel",
        "panningAllowedLabel",
        "zoomingAllowedLabel",
      ];
      otherOptions.forEach((option) => {
        document.getElementById(option).style.display = e.target.checked
          ? "none"
          : "inline-block";
      });
    });

    document.getElementById("anyRoundTime").addEventListener("change", (e) => {
      if (this.today) {
        filteredEvents = filteredEvents.filter((event) => {
          let date = new Date(event.timestamp);
          date.setHours(12, 0, 0, 0);
          let today_date = new Date();
          today_date.setHours(12, 0, 0, 0);
          return today_date.getTime() == date.getTime();
        });
      }
      document.getElementById("roundTime").style.display = e.target.checked
        ? "none"
        : "inline-block";
    });

    document.getElementById("anyRoundCount").addEventListener("change", (e) => {
      document.getElementById("roundCount").style.display = e.target.checked
        ? "none"
        : "inline-block";
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      (async () => {
        this.events = await getEvents();
        this.update();
      })();
    });
  }

  addMapsSelectOptions(maps) {
    const mapSelect = document.getElementById("mapSelect");
    removeOptions(mapSelect);
    mapSelect.options[0] = new Option("All", "All");

    let popularMaps = {
      "57357d9f77abe957e8cfd15f": "Dumb test",
      "62a44b22040f04bd36e8a914": "A Community World",
      "5d0ce72c8b19a91fe05aa7a8": "Flags of the World",
      "56f28536148a781b143b0c3b": "European stadiums",
      "5cfda2c9bc79e16dd866104d": "I Saw The Sign 2.0",
      "5b0d907bfaa4cf3ce43bc6b1": "500 000 lieux en France métropolitaine !",
      "56e45886dc7cd6a164e861ac": "US Cities",
      "5d374dc141d2a43c1cd4527b": "GeoDetective",
      "60de2a8a81b92c00015f29e1": "The 198 Capitals Of The World",
      "5d73f83d82777cb5781464f2": "A Balanced World",
      "5dbaf08ed0d2a478444d2e8e": "AI Generated World",
      "6029991c5048850001d572a9": "A Pinpointable World",
      "5cd30a0d17e6fc441ceda867": "An Extraordinary World",
      "6078c830e945e900015f4a64": "A Learning World",
      "6089bfcff6a0770001f645dd": "An Arbitrary World",
      "5754651a00a27f6f482a2a3d": "Where's that Mcdonald's?",
      "5bbb74ce2c01735208560cf6": "World Cities",
      "5b0a80f8596695b708122809": "An Improved World",
      "59e940ed39d855c868104b32": "GeoBettr World - Replayable",
      "5ed59e1f375e6a6a68a2d227": "All the Wetherspoons",
      "5eb5ea048734a02c543f2ae1": "La Diversité Française ",
      "65c86935d327035509fd616f": "A Rainbolt World",
      "61a1846aee665b00016680ce": "Fun with Flags!",
      "5fa381d0e27b4900014e0732":
        "Interesting Photospheres in Obscure Countries",
      "57357d9f77abe957e8cfd10f": "Dumb test",
      "60de2a8a81b92c00010f29e1": "The 198 Capitals Of The World",
    };

    for (let map of maps) {
      var option;
      if (map in popularMaps) option = new Option(popularMaps[map], map);
      else if (map == "world") option = new Option(map, map);
      else option = new Option(map, map);
      mapSelect.options[mapSelect.options.length] = option;
    }
    mapSelect.addEventListener("change", (e) => {
      this.map = e.target.value;
      this.populateTopScore();
    });
  }

  getPlayers() {
    var players = new Map();

    var filteredEvents = this.events.filter(
      (event) => event.code == "LiveChallengeLeaderboardUpdate"
    );

    for (var event of filteredEvents) {
      for (
        let i = 0;
        i < event.liveChallenge.leaderboards.round.guesses.length;
        i++
      ) {
        let entry = event.liveChallenge.leaderboards.round.entries[i];
        let player_name = entry.name;
        if (players.has(player_name)) {
          let old_val = players.get(player_name);
          players.set(player_name, old_val + 1);
        } else players.set(player_name, 1);
      }
    }

    var players = Array.from(players).map(([name, value]) => ({ name, value }));
    players = players.sort((a, b) => b.value - a.value);

    var result = [];

    players.forEach((player) => {
      result.push(player.name);
    });

    return result;
  }

  addPlayersSelectOptions() {
    var select = document.getElementById("playerSelect");
    removeOptions(select);
    select.options[0] = new Option("All", "All");
    for (let player of this.players)
      select.options[select.options.length] = new Option(player, player);
    select.addEventListener("change", (e) => {
      this.player = e.target.value;
      this.populateTopScore();
    });
  }

  populateTopScore() {
    var scoreList = document.getElementById("scoreList");

    this.currentPage = 1;
    scoreList.innerHTML = "";

    var filteredEvents = this.events.filter(
      (event) => event.code == "LiveChallengeLeaderboardUpdate"
    );
    filteredEvents = filteredEvents.filter(
      (event) => event.gameId in this.gameOptions
    );

    if (this.map != "All")
      filteredEvents = filteredEvents.filter(
        (event) => this.gameOptions[event.gameId].mapSlug == this.map
      );
    if (!this.anyRoundCount) {
      filteredEvents = filteredEvents.filter(
        (event) => this.gameOptions[event.gameId].roundCount == this.roundCount
      );
    }
    if (!this.anyOptions) {
      filteredEvents = filteredEvents.filter(
        (event) =>
          this.gameOptions[event.gameId].movementOptions.forbidMoving ==
          !this.movingAllowed
      );
      filteredEvents = filteredEvents.filter(
        (event) =>
          this.gameOptions[event.gameId].movementOptions.forbidRotating ==
          !this.panningAllowed
      );
      filteredEvents = filteredEvents.filter(
        (event) =>
          this.gameOptions[event.gameId].movementOptions.forbidZooming ==
          !this.zoomingAllowed
      );
    }
    if (!this.anyRoundTime) {
      filteredEvents = filteredEvents.filter(
        (event) => this.gameOptions[event.gameId].roundTime == this.roundTime
      );
    }

    if (this.timeFrame == "today") {
      filteredEvents = filteredEvents.filter((event) => {
        let date = new Date(event.timestamp);
        date.setHours(12, 0, 0, 0);
        let today_date = new Date();
        today_date.setHours(12, 0, 0, 0);
        return today_date.getTime() == date.getTime();
      });
    } else if (this.timeFrame === "customRange" && this.dateRange.length > 0) {
      const startDate = new Date(this.dateRange[0]);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(
        this.dateRange.length === 2 ? this.dateRange[1] : this.dateRange[0]
      );
      endDate.setHours(23, 59, 59, 999);

      filteredEvents = filteredEvents.filter((event) => {
        if (!event.timestamp) return false;
        const parsableTimestamp = event.timestamp.replace(/(\.\d{3})\d+/, "$1");
        const eventDate = new Date(parsableTimestamp);
        return (
          !isNaN(eventDate) && eventDate >= startDate && eventDate <= endDate
        );
      });
    }

    this.filteredEvents = filteredEvents;

    // extract all round scores
    var roundScores = [];
    var nonStandardGames = new Set();
    for (var event of filteredEvents) {
      let gameId = event.gameId;
      let roundNumber = event.liveChallenge.leaderboards.round.roundNumber;
      for (
        let i = 0;
        i < event.liveChallenge.leaderboards.round.guesses.length;
        i++
      ) {
        let guess = event.liveChallenge.leaderboards.round.guesses[i];
        let entry = event.liveChallenge.leaderboards.round.entries[i];
        if (!guess) {
          guess = {};
        }
        guess["gameId"] = gameId;
        guess["roundNumber"] = roundNumber;
        if (roundNumber > 5) nonStandardGames.add(gameId);
        guess["playerName"] = entry.name;
        roundScores.push(guess);
      }
    }
    var roundScoresCopy = roundScores;
    roundScores = [];
    for (var score of roundScoresCopy) {
      if (!nonStandardGames.has(score["gameId"])) roundScores.push(score);
    }

    // deduplicate roundScores by gameId, roundNumber and playerName
    var uniqueRoundScores = [];
    var uniqueRoundScoresHashes = new Set();
    for (var score of roundScores) {
      let hash = `${score.gameId}-${score.roundNumber}-${score.playerName}`;
      if (!uniqueRoundScoresHashes.has(hash)) {
        uniqueRoundScoresHashes.add(hash);
        uniqueRoundScores.push(score);
      }
    }

    // calculate total score for each game and playerName, save result in gameScores
    var gameScores = [];
    for (var score of uniqueRoundScores) {
      var gameId = score.gameId;
      var gameOption = this.gameOptions[gameId];
      var playerName = score.playerName;
      if (
        !gameScores.find(
          (s) => s.gameId == gameId && s.playerName == playerName
        )
      ) {
        gameScores.push({
          gameId,
          playerName,
          date: gameOption.date,
          totalScore: 0,
        });
      }
      var gameScore = gameScores.find(
        (s) => s.gameId == gameId && s.playerName == playerName
      );
      gameScore.totalScore += score.score;
    }
    gameScores = gameScores.filter((record) => !isNaN(record.totalScore));
    if (this.player && this.player != "All")
      gameScores = gameScores.filter(
        (record) => record.playerName == this.player
      );

    // sort gameScores by totalScore descending
    this.allGameScores = gameScores.sort((a, b) => b.totalScore - a.totalScore);

    this.displayScores();
  }

  displayScores() {
    const scoreList = document.getElementById("scoreList");
    const loadMoreButton = document.getElementById("loadMoreButton");
    const scoreContainer = document.getElementById("scoreListContainer");
    const noDataMessage = document.getElementById("noDataMessage");

    if (this.allGameScores.length === 0) {
      noDataMessage.style.display = "block";
      scoreContainer.style.display = "none";
      loadMoreButton.style.display = "none";
      return;
    }

    noDataMessage.style.display = "none";
    scoreContainer.style.display = "block";

    const startIndex = (this.currentPage - 1) * this.scoresPerPage;
    const endIndex = startIndex + this.scoresPerPage;

    const scoresToShow = this.allGameScores.slice(startIndex, endIndex);

    let firstNewElement = null;

    scoresToShow.forEach((score, index) => {
      const li = document.createElement("li");
      const dateString = score.date.toLocaleDateString();
      li.textContent = `${score.playerName}: ${score.totalScore} (${dateString})`;
      scoreList.appendChild(li);

      if (index === 0) {
        firstNewElement = li;
      }
    });

    if (this.currentPage > 1 && firstNewElement) {
      const newElementOffset =
        firstNewElement.offsetTop - scoreContainer.offsetTop;

      scoreContainer.scrollTo({
        top: newElementOffset,
        behavior: "smooth",
      });
    }

    if (endIndex < this.allGameScores.length) {
      loadMoreButton.style.display = "block";
    } else {
      loadMoreButton.style.display = "none";
    }
  }

  handleImport(file) {
    if (!file) {
      return;
    }

    setLoadingState(true);

    importData(file)
      .then(() => {
        showToast("Data imported successfully! Reloading...", "success", () =>
          location.reload()
        );
      })
      .catch((error) => {
        setLoadingState(false);
        showToast("Import failed. Check the console for details.", "error");
        console.error("Import error:", error);
      });
  }

  exportToJsonl() {
    let leaderboardEvents = this.filteredEvents;

    if (this.player && this.player != "All") {
      leaderboardEvents = leaderboardEvents.filter((event) => {
        return event.liveChallenge.leaderboards.round.entries.some(
          (entry) => entry.name === this.player
        );
      });
    }

    const finalGameIds = new Set(
      leaderboardEvents.map((event) => event.gameId)
    );

    if (finalGameIds.size === 0) {
      showToast("No data to export for the selected filters.", "error");
      return;
    }

    const gameToPartyMap = new Map();
    for (const event of this.events) {
      if (event.gameId && event.topic && event.topic.startsWith("partyv2:")) {
        const partyId = event.topic.split(":")[1];
        if (partyId) {
          gameToPartyMap.set(event.gameId, partyId);
        }
      } else if (event.code === "PartyGameStarted" && event.payload) {
        try {
          const payloadData = JSON.parse(event.payload);
          if (payloadData.lobbyId && payloadData.partyId) {
            gameToPartyMap.set(payloadData.lobbyId, payloadData.partyId);
          }
        } catch (e) {}
      }
    }

    const finalPartyIds = new Set();
    for (const gameId of finalGameIds) {
      if (gameToPartyMap.has(gameId)) {
        finalPartyIds.add(gameToPartyMap.get(gameId));
      }
    }

    const eventsToExport = this.events.filter((event) => {
      if (finalGameIds.has(event.gameId)) {
        return true;
      }

      if (event.topic && event.topic.startsWith("partyv2:")) {
        const partyId = event.topic.split(":")[1];
        if (finalPartyIds.has(partyId)) {
          return true;
        }
      }

      return false;
    });

    const jsonlContent = eventsToExport
      .map((event) => JSON.stringify(event))
      .join("\n");
    const blob = new Blob([jsonlContent], { type: "application/x-jsonlines" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "geoguessr_events.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  initDatepicker() {
    flatpickr("#dateRangePicker", {
      mode: "range",
      dateFormat: "Y-m-d",
      altInput: true,
      altFormat: "d.m.Y",
      maxDate: "today",
      locale: {
        rangeSeparator: " - ", 
      },
      onClose: (selectedDates) => {
        if (selectedDates.length > 0) {
          this.dateRange = selectedDates;
          this.populateTopScore();
        }
      },
    });
  }
}

async function populate() {
  setLoadingState(true);
  try {
    var events = await getEvents();
    new Stats(events);
  } catch (error) {
    console.error("Error populating stats:", error);
    setLoadingState(false);
  } finally {
    setLoadingState(false);
  }
}

document.addEventListener("DOMContentLoaded", populate);
