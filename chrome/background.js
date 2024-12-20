chrome.action.onClicked.addListener((message) => {
    chrome.tabs.create({
        url: 'events.html'
    });
});

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
                db.createObjectStore("Events", { keyPath: '_id', autoIncrement: true });
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

chrome.runtime.onMessage.addListener((message) => {
    console.log("ws: received data from content script", message);

    let data = JSON.parse(message.data);
    if (data["code"] == "BullseyeGuess")
        return
    saveData(data);
});