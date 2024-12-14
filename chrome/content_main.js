(function () {
    WebSocket.prototype.oldSend = WebSocket.prototype.send;

    WebSocket.prototype.send = function (data) {
        console.log("ws: sending data", data);
        window.postMessage({ "type": "websocket_sent", "data": data }, "*");
        WebSocket.prototype.oldSend.apply(this, [data]);
    };

    var oldAddEventListener = WebSocket.prototype.addEventListener;
    WebSocket.prototype.addEventListener = function (eventName, callback) {
        return oldAddEventListener.apply(this, [eventName,
            (e) => {
                if (e.type == "message" && e.data.type && (e.data.type == "websocket_received" || e.data.type == "websocket_sent"))
                    return
                if (e.type == "message") {
                    console.log("ws: receiving data", e.data);
                    window.postMessage({ "type": "websocket_received", "data": e.data }, "*");
                }
                callback(e)
            }
        ])
    };
})();
