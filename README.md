# Overview

Chrome extension to collect data from playing Geoguessr party games.

It saves data to browser's IndexedDB, so your data takes up some space and is only available in your browser.

You can export this data to JSONL file by clicking on extension icon.

# How it works

In party games, Geoguessr uses WebSocket to sync game state between players. Therefore, all events like your particular guess or round start are sent as WebSocket messages. In order to collect this data, we need to intercept those messages. It is only possible in a hacky way, by attaching to a debugger and filtering out WebSocket networking events. This means that extension has much more permissions than it actually needs. But it works, so yay.

This approach won't work in Firefox, as their debugger API is different. For Firefox you would need another, even more hacky approach - monkey patch "WebSocket" constructor. See this [SO question](https://stackoverflow.com/questions/31181651/inspecting-websocket-frames-in-an-undetectable-way).

# Final words

I really hope Geoguessr adds a game history feature so that this hacky solution is obsolete.