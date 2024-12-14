# Overview

Browser extension (Chrome/Firefox) to collect data on your Geoguessr party games.

It saves data to extension's IndexedDB, so your data takes up some space and is only available in your extension.

You can export this data to JSONL file by clicking on extension icon and then clicking on "Export data" in newly opened tab.

# How it works

In party games, Geoguessr uses WebSocket to sync game state between players. Therefore, all events like your particular guess or round start are sent as WebSocket messages. In order to collect this data, we need to intercept those messages. It is only possible in a hacky way, by monkey-patching "WebSocket" object, intercepting messages, and sending them first to isolated content sciprt, and then to background script. It is not really dangerous in any way, if done right. Just something to be aware of.

# P.S.

I really hope Geoguessr adds a game history feature so that this hacky solution is obsolete.