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
    console.error("Error in getEvents:", error);
    return Promise.resolve([]);
  }
}
