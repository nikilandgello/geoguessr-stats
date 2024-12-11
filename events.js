let db;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        let dbRequest = indexedDB.open("GeoGuessrStats", 1);

        dbRequest.onupgradeneeded = function (event) {
            db = event.target.result;
            if (!db.objectStoreNames.contains("Events")) {
                db.createObjectStore("Events", { keyPath: "id" });
            }
        };

        dbRequest.onsuccess = function (event) {
            db = event.target.result;
            resolve(db);
        };

        dbRequest.onerror = function (event) {
            console.error("Database error: " + event.target.error);
            reject("Database error");
        };
    });
}

async function getAllData() {
    try {
        await openDB();
        return new Promise((resolve, reject) => {
            let transaction = db.transaction(["Events"], "readonly");
            let store = transaction.objectStore("Events");
            let request = store.getAll();

            request.onsuccess = function (event) {
                let records = event.target.result;
                var processed_records = [];
                for (let record of records) {
                    if ("data" in record)
                        processed_records.push(record.data)
                    else
                        processed_records.push(record)
                }
                resolve(processed_records);
            };

            request.onerror = function (event) {
                reject("Error getting all data");
            };
        });
    } catch (error) {
        console.error("Error in getAllData:", error);
    }
}

function populateTable(events) {
    const tableBody = document.getElementById('eventsTableBody');
    tableBody.innerHTML = '';
    events = events.slice(-15);
    events = events.reverse();
    events.forEach(event => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = JSON.stringify(event);
    });
}

function exportToJsonl(events) {
    const jsonlContent = events.map(event => JSON.stringify(event)).join('\n');
    const blob = new Blob([jsonlContent], { type: 'application/x-jsonlines' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geoguessr_events.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function importData(file) {
    const content = await file.text();
    const events = content.split('\n').filter(line => line.trim() !== '').map(JSON.parse);

    try {
        await openDB();
        const transaction = db.transaction(["Events"], "readwrite");
        const store = transaction.objectStore("Events");

        for (const event of events) {
            await store.add(event);
        }

        console.log("Data imported successfully");
        return await getAllData();
    } catch (error) {
        console.error("Error importing data:", error);
    }
}

function handleImport() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
        importData(file).then(updatedEvents => {
            if (updatedEvents) {
                populateTable(updatedEvents);
            }
        });
    } else {
        alert("Please select a file to import.");
    }
}

class Stats {
    constructor(events) {
        this.events = events;
        this.gameOptions = this.getGameOptions();

        var maps = new Set();
        for (let game of Object.entries(this.gameOptions)) {
            maps.add(game[1].mapSlug);
        }
        this.map = "world";
        this.addSelectOptions(maps);

        this.players = this.getPlayers();
        this.players_today = this.getPlayers(true);
        this.addPlayersSelectOptions();
    }

    getGameOptions() {
        var filteredEvents = this.events.filter(event => event.code == "LiveChallengeFinished");
        var gameOptions = new Map();
        for (var event of filteredEvents) {
            event.liveChallenge.state.options["date"] = new Date(event.timestamp);
            gameOptions[event.gameId] = event.liveChallenge.state.options;
        }
        return gameOptions;
    }

    addSelectOptions(maps) {
        const mapSelect = document.getElementById("mapSelect");

        for (let map of maps) {
            var option;
            if (map == "5d374dc141d2a43c1cd4527b")
                option = new Option("GeoDetective", map);
            else if (map == "world")
                option = new Option(map, map, true, true);
            else
                option = new Option(map, map);
            mapSelect.options[mapSelect.options.length] = option;
        }
        mapSelect.addEventListener("change", (e) => {
            this.map = e.target.value;
            this.populateTopScore();
            this.populateTopScore(true);
        })
    }

    getPlayers(today = false) {
        var players = new Map();

        var filteredEvents = this.events.filter(event => event.code == "LiveChallengeLeaderboardUpdate");
        if (today) {
            filteredEvents = filteredEvents.filter(event => {
                let date = new Date(event.timestamp);
                date.setHours(12, 0, 0, 0);
                let today_date = new Date();
                today_date.setHours(12, 0, 0, 0);
                return today_date.getTime() == date.getTime()
            });
        }

        for (var event of filteredEvents) {
            for (let i = 0; i < event.liveChallenge.leaderboards.round.guesses.length; i++) {
                let entry = event.liveChallenge.leaderboards.round.entries[i];
                let player_name = entry.name;
                if (players.has(player_name)) {
                    let old_val = players.get(player_name);
                    players.set(player_name, old_val + 1);
                }
                else
                    players.set(player_name, 1);
            }
        }
        console.log(players);

        var players = Array.from(players).map(([name, value]) => ({ name, value }))
        players = players.sort((a, b) => b.value - a.value);

        players = players.slice(0, 10);
        var result = [];

        players.forEach(player => {
            result.push(player.name);
        });

        return result;
    }

    addPlayersSelectOptions() {
        var select = document.getElementById("topScoreTodayPlayerSelect");
        for (let player of this.players_today)
            select.options[select.options.length] = new Option(player, player);
        select.addEventListener("change", (e) => {
            this.populateTopScoreToday(e.target.value);
        })

        select = document.getElementById("topScoreAllTimePlayerSelect");
        for (let player of this.players)
            select.options[select.options.length] = new Option(player, player);
        select.addEventListener("change", (e) => {
            this.populateTopScore(false, e.target.value);
        });
    }

    populateTopScore(today = false, player = null) {
        if (today)
            var topScoreDiv = document.getElementById('topScoreToday');
        else
            var topScoreDiv = document.getElementById('topScoreAllTime');
        var scoreList = topScoreDiv.getElementsByClassName("scoreList")[0];
        while (scoreList.firstChild) {
            scoreList.removeChild(scoreList.lastChild);
        }

        // filter events by code = LiveChallengeLeaderboardUpdate
        var filteredEvents = this.events.filter(event => event.code == "LiveChallengeLeaderboardUpdate");
        // filter events where map is default, only 5 rounds are played, and no movement allowed
        filteredEvents = filteredEvents.filter(event => event.gameId in this.gameOptions);
        filteredEvents = filteredEvents.filter(event => this.gameOptions[event.gameId].mapSlug == this.map);
        filteredEvents = filteredEvents.filter(event => this.gameOptions[event.gameId].roundCount == 5);
        filteredEvents = filteredEvents.filter(event => this.gameOptions[event.gameId].movementOptions.forbidMoving);

        // if today=true, filter by date
        if (today) {
            filteredEvents = filteredEvents.filter(event => {
                let date = new Date(event.timestamp);
                date.setHours(12, 0, 0, 0);
                let today_date = new Date();
                today_date.setHours(12, 0, 0, 0);
                return today_date.getTime() == date.getTime()
            });
        } else {
            filteredEvents = filteredEvents.filter(event => {
                let date = new Date(event.timestamp);
                date.setHours(12, 0, 0, 0);
                let today_date = new Date(2024, 7, 4);
                today_date.setHours(12, 0, 0, 0);
                return today_date.getTime() <= date.getTime()
            });
        }

        // extract all round scores
        var roundScores = [];
        var nonStandardGames = new Set();
        for (var event of filteredEvents) {
            let gameId = event.gameId;
            let roundNumber = event.liveChallenge.leaderboards.round.roundNumber;
            for (let i = 0; i < event.liveChallenge.leaderboards.round.guesses.length; i++) {
                let guess = event.liveChallenge.leaderboards.round.guesses[i];
                let entry = event.liveChallenge.leaderboards.round.entries[i];
                if (!guess) {
                    guess = {};
                }
                guess["gameId"] = gameId;
                guess["roundNumber"] = roundNumber;
                if (roundNumber > 5)
                    nonStandardGames.add(gameId);
                guess["playerName"] = entry.name;
                roundScores.push(guess);
            }
        }
        var roundScoresCopy = roundScores;
        roundScores = [];
        for (var score of roundScoresCopy) {
            if (!nonStandardGames.has(score["gameId"]))
                roundScores.push(score);
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
            if (!gameScores.find(s => s.gameId == gameId && s.playerName == playerName)) {
                gameScores.push({ gameId, playerName, "date": gameOption.date, totalScore: 0 });
            }
            var gameScore = gameScores.find(s => s.gameId == gameId && s.playerName == playerName);
            gameScore.totalScore += score.score;
        }
        gameScores = gameScores.filter((record) => !isNaN(record.totalScore));
        if (player && player != "All")
            gameScores = gameScores.filter((record) => record.playerName == player)

        // sort gameScores by totalScore descending
        gameScores = gameScores.sort((a, b) => b.totalScore - a.totalScore);
        gameScores = gameScores.slice(0, 5);

        // populate topScoreToday div
        for (var score of gameScores) {
            scoreList.innerHTML += `<li>${score.playerName}: ${score.totalScore} (${score.date.toLocaleDateString()})</li>`;
        }
    }

    populateTopScoreToday(player = null) {
        this.populateTopScore(true, player);
    }
}


document.addEventListener('DOMContentLoaded', async function () {
    const events = await getAllData();

    var stats = new Stats(events);
    stats.populateTopScore();
    stats.populateTopScoreToday();

    populateTable(events);

    document.getElementById('exportButton').addEventListener('click', function () {
        exportToJsonl(events);
    });

    document.getElementById('importButton').addEventListener('click', handleImport);
});
