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
                resolve(event.target.result);
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

function getGameOptions(events) {
    var filteredEvents = events.filter(event => event.code === "LiveChallengeFinished");
    var gameOptions = new Map();
    for (var event of filteredEvents) {
        gameOptions[event.data.gameId] = event.data.liveChallenge.state.options;
    }
    return gameOptions;
}


function populateTopScore(events, today = false) {
    const gameOptions = getGameOptions(events);

    // filter events by code = LiveChallengeLeaderboardUpdate
    var filteredEvents = events.filter(event => event.code === "LiveChallengeLeaderboardUpdate");
    // filter events where map is default, only 5 rounds are played, and no movement allowed
    filteredEvents = filteredEvents.filter(event => gameOptions[event.data.gameId].mapSlug == 'world');
    filteredEvents = filteredEvents.filter(event => gameOptions[event.data.gameId].roundCount == 5);
    filteredEvents = filteredEvents.filter(event => gameOptions[event.data.gameId].movementOptions.forbidMoving);

    // if today=true, filter by date
    if (today) {
        filteredEvents = filteredEvents.filter(event => {
            let date = new Date(event.timestamp);
            date.setHours(12, 0, 0, 0);
            let today_date = new Date();
            today_date.setHours(12, 0, 0, 0);
            return today_date.getTime() == date.getTime()
        });
    }

    // extract all round scores
    var roundScores = [];
    var nonStandardGames = new Set();
    for (var event of filteredEvents) {
        let gameId = event.data.gameId;
        let roundNumber = event.data.liveChallenge.leaderboards.round.roundNumber;
        for (let i = 0; i < event.data.liveChallenge.leaderboards.round.guesses.length; i++) {
            let guess = event.data.liveChallenge.leaderboards.round.guesses[i];
            let entry = event.data.liveChallenge.leaderboards.round.entries[i];
            if (!guess) {
                guess = {};
            }
            guess["gameId"] = gameId;
            if (gameId == 'd017f9d6-d6e4-4360-b66d-b1ee0f16bb1c') {
                console.log(event);
            }
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
        let gameId = score.gameId;
        let playerName = score.playerName;
        if (!gameScores.find(s => s.gameId === gameId && s.playerName === playerName)) {
            gameScores.push({ gameId, playerName, totalScore: 0 });
        }
        let gameScore = gameScores.find(s => s.gameId === gameId && s.playerName === playerName);
        gameScore.totalScore += score.score;
    }
    // sort gameScores by totalScore descending
    gameScores.sort((a, b) => b.totalScore - a.totalScore);
    gameScores = gameScores.slice(0, 5);

    // populate topScoreToday div
    if (today)
        var topScoreDiv = document.getElementById('topScoreToday');
    else
        var topScoreDiv = document.getElementById('topScoreAllTime');
    for (var score of gameScores) {
        topScoreDiv.innerHTML += `${score.playerName}: ${score.totalScore};<br>`;
    }
}


document.addEventListener('DOMContentLoaded', async function () {
    const events = await getAllData();
    populateTable(events);
    populateTopScore(events);
    populateTopScore(events, true);

    document.getElementById('exportButton').addEventListener('click', function () {
        exportToJsonl(events);
    });

    document.getElementById('importButton').addEventListener('click', handleImport);
});
