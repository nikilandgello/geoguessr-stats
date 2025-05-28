let db;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    const dbRequest = indexedDB.open("GeoGuessrStats", 1);

    dbRequest.onupgradeneeded = function (event) {
      db = event.target.result;
      if (!db.objectStoreNames.contains("Events")) {
        db.createObjectStore("Events", { keyPath: "_id", autoIncrement: true });
      }
    };

    dbRequest.onsuccess = function (event) {
      db = event.target.result;
      resolve(db);
    };

    dbRequest.onerror = function (event) {
      reject("Database error: " + event.target.error);
    };
  });
}

export async function getEvents() {
  try {
    const currentDb = await openDB();
    return new Promise((resolve, reject) => {
      if (!currentDb.objectStoreNames.contains("Events")) {
        console.warn("'Events' object store not found.");
        resolve([]);
        return;
      }
      let transaction = currentDb.transaction(["Events"], "readonly");
      let store = transaction.objectStore("Events");
      let request = store.getAll();

      request.onsuccess = function (event) {
        let records = event.target.result;
        resolve(records || []);
      };

      request.onerror = function (event) {
        console.error("Error getting all data:", event.target.error);
        reject("Error getting all data: " + event.target.error);
      };
    });
  } catch (error) {
    console.error("Error in getEvents:", error.message);
    throw error;
  }
}

//get the current player name from the latest PartyMemberListUpdated event
export async function getCurrentPlayerName(events) {
  const partyEvent = events.findLast(
    (event) => event.code === "PartyMemberListUpdated"
  );

  if (!partyEvent) return null;

  let playerData;
  try {
    playerData = JSON.parse(partyEvent.payload);
  } catch (e) {
    console.error("getCurrentPlayerName:", e.message);
    return null;
  }

  try {
    const result = await new Promise((resolve, reject) => {
      chrome.storage.local.get("currentPlayerId", (data) => {
        if (chrome.runtime.lastError) {
          console.error(
            `[fetchCurrentPlayerNick] Error getting currentPlayerId from storage:`,
            chrome.runtime.lastError.message
          );
          reject(chrome.runtime.lastError);
        } else {
          resolve(data.currentPlayerId);
        }
      });
    });

    const storedPlayerId = result;

    if (storedPlayerId) {
      const foundMember = playerData.members.find(
        (member) => member.userId === storedPlayerId
      );
      return foundMember?.nick || null;
    }
    return null;
  } catch (error) {
    console.error(
      "fetchCurrentPlayerNick: Error during storage access for currentPlayerId:",
      error
    );
    return null;
  }
}
