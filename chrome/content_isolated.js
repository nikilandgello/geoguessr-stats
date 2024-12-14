

window.addEventListener("message", (event) => {
    if (event.data.type == "websocket_received") {
        console.log("ws: passing data to background", event);
        chrome.runtime.sendMessage({ type: "websocket_passed", data: event.data.data });
    }
});