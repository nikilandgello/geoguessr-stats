chrome.action.onClicked.addListener((message) => {
    chrome.tabs.create({
        url: 'events_page/events.html'
    });
});

let db;
const gamesWaitingForFinalUpdate = new Set();

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

async function saveData(data) {
  // note that only valid JSON objects can be saved
  try {
    await openDB();
    let transaction = db.transaction(["Events"], "readwrite");
    let store = transaction.objectStore("Events");
    let request = store.add(data);

    return new Promise((resolve, reject) => {
      request.onsuccess = function (event) {
        console.log("Data saved successfully with ID:", event.target.result);
        resolve(event.target.result);
      };

      request.onerror = function (event) {
        console.error("Error saving data:", event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error("Error saving data:", error, data);
  }
}

//local storage functions
function getLocalStorageItem(key, callback) {
  chrome.storage.local.get(key, (result) => {
    if (chrome.runtime.lastError) {
      console.error(
        `[BG] Error getting ${key} from storage:`,
        chrome.runtime.lastError.message
      );
      callback(undefined);
      return;
    }

    callback(result[key]);
  });
}

function setLocalStorageItem(itemsToSet, callback) {
  chrome.storage.local.set(itemsToSet, () => {
    if (chrome.runtime.lastError) {
      console.error(
        `[BG] Error setting items in storage:`,
        itemsToSet,
        chrome.runtime.lastError.message
      );
      if (callback) {
        callback(chrome.runtime.lastError);
      }
      return;
    }

    if (callback) {
      callback(null);
    }
  });
}

//save the current player ID in local storage if it is not already set
function updatePlayerIdIfNeeded(incomingPlayerId) {
  if (!incomingPlayerId) return;

  getLocalStorageItem("currentPlayerId", (storedPlayerId) => {
    if (storedPlayerId === incomingPlayerId) {
      console.log(
        `[BG] Player ID is already set to ${incomingPlayerId}. No update needed.`
      );
      return;
    }
    setLocalStorageItem({ currentPlayerId: incomingPlayerId });
  });
}

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.data?.code === "HeartBeat" || !message.data?.code) return;

  if (message.type === "websocket_passed") {
    console.log("[BG] websocket_passed", message.data);

    const data = message.data;
    if (data?.code === "BullseyeGuess") return;
     try {
       await saveData(data);

       if (data.code === "LiveChallengeFinished") {
         const gameId = data.gameId;
         if (!gameId) return; 

         gamesWaitingForFinalUpdate.add(gameId);
         setTimeout(() => {
           if (gamesWaitingForFinalUpdate.has(gameId)) {
             gamesWaitingForFinalUpdate.delete(gameId);
           }
         }, 10000);
       } else if (data.code === "LiveChallengeLeaderboardUpdate") {
         const gameId = data.gameId;

         if (gameId && gamesWaitingForFinalUpdate.has(gameId)) {
           console.log(
             `[BG] Final update for ${gameId} received. Triggering UI refresh.`
           );
           
           chrome.runtime.sendMessage({
             type: "newGameFinished",
             payload: data,
           }).catch((error) => {
             if (error.message.includes("Receiving end does not exist")) {
             } else {
               console.error("Unexpected error sending message:", error);
              }
           });
           gamesWaitingForFinalUpdate.delete(gameId);
         }
       }
     } catch (error) {
       console.error("[BG] Failed to save or process websocket data:", error);
     }
  } else if (
    message.type === "websocket_sent" &&
    message.data?.code === "SubscribeToLobby"
  ) {
    const incomingPlayerId = message.data?.playerId;
    updatePlayerIdIfNeeded(incomingPlayerId);
  }
});
