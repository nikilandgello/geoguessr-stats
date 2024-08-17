
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

document.addEventListener('DOMContentLoaded', async function () {
    const events = await getAllData();
    populateTable(events);

    document.getElementById('exportButton').addEventListener('click', function () {
        exportToJsonl(events);
    });
});
