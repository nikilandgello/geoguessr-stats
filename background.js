chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({
        url: chrome.runtime.getURL("events.html")
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
                db.createObjectStore("Events", { autoIncrement: true });
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
    try {
        await openDB();
        let transaction = db.transaction(["Events"], "readwrite");
        let store = transaction.objectStore("Events");
        await store.add(data);
        console.log("Data saved successfully");
    } catch (error) {
        console.error("Error saving data:", error);
    }
}

async function getAllData() {
    try {
        await openDB();
        return new Promise((resolve, reject) => {
            let transaction = db.transaction(["Events"], "readonly");
            let store = transaction.objectStore("Events");
            let request = store.getAll();

            request.onsuccess = function (event) {
                console.log("All data retrieved:", event.target.result);
                resolve(event.target.result);
            };

            request.onerror = function (event) {
                console.error("Error getting all data:", event.target.error);
                reject("Error getting all data");
            };
        });
    } catch (error) {
        console.error("Error in getAllData:", error);
    }
}

// Function to attach debugger and enable network
function attachDebuggerAndEnableNetwork(tabId) {
    chrome.debugger.attach({ tabId: tabId }, "1.2", function () {
        if (chrome.runtime.lastError) {
            console.error("Debugger attach error:", chrome.runtime.lastError.message);
            return;
        }

        chrome.debugger.sendCommand({ tabId: tabId }, "Network.enable", {}, function () {
            if (chrome.runtime.lastError) {
                console.error("Network enable error:", chrome.runtime.lastError.message);
            } else {
                console.log("Network enabled for tab", tabId);
            }
        });
    });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        attachDebuggerAndEnableNetwork(tabId);
    }
});

// Listen for debugger events
chrome.debugger.onEvent.addListener(function (source, method, params) {
    if (method === "Network.webSocketFrameReceived") {
        data = JSON.parse(params["response"]["payloadData"]);
        console.log("WebSocket Frame Received:", data);
        if (data["code"] == "BullseyeGuess")
            return
        saveData(data);
    }
});