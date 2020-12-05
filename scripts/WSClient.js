
var ws
let temp_ids = []

/**
 * Connects to the server. Callback is never run if an error occurs.
 * @param {function} callback Once verified by the server, run this callback and pass the websocket.
 */
function EstablishWebsocketConnection(callback) {
    let protocol = "ws:";
    // if (window.location.protocol === "https:") {
    //     protocol = "wss:"
    // }
    ws = new WebSocket(protocol + "//" + window.location.hostname + ":8000");

    ws.onopen = function() {
        console.log("[Websocket] Established connection");
        ws.send(JSON.stringify({
            "type": "SETUP",
            "key": "SRSLy bro, just let me in. I got stuff I need to send."
        }))
    }

    ws.onmessage = function (rawMessage) {
        let msg = JSON.parse(rawMessage.data);
        let type = msg.type.toUpperCase();
        let pcpair;
        let streamer;

        switch(type) {
            case "VERIFIED":
                console.log("[Websocket] Verified", msg);
                SetApplicationState(msg.state);
                ApplicationState = msg.state;
                callback(ws);
                break;
            case "RTC SOCKET ID":
                // Update CPPairs
                pcpair = PCPair.get(null, null, msg.socketid, msg.wsid).pair;

                // If it's a new connection, generate pair and announce your own id
                if (!pcpair) {
                    pcpair = new PCPair(undefined, undefined, msg.socketid, msg.wsid, msg.xr);
                    PCPair.announceIds();
                }

                // Setup or update streamer
                // TODO: determine if a streamer needs to be built
                // TODO: determine if the state has changed between xr and non-xr
                streamer = pcpair.getStreamer();

                // Build a streamer if needed
                if (!streamer) {
                    if (msg.xr) {
                        steamer = new AvatarStreamer(scene, p, pcpair);
                    }
                    else {
                        streamer = new VideoStreamer(scene, p, pcpair);
                    }
                }
                else {
                    if (msg.xr !== streamer.xr)
                }
                    
                break;
            case "POSE":
                // console.log(msg.id, "sent pose", msg.head);
                break;
            case "REFRESH":
                window.location.reload();
                break;
            default:
                console.error("[Websocket] Unknown message received from server of", type, "type. Contents:", msg);
                break;
        }
    }

    ws.onerror = function(error) {
        console.error("[Websocket] error", error);
    }

    ws.onclose = function() {
        console.warn("Disconnected from server. Reconnecting in 5 seconds...");
        setTimeout(function() {
            // wait 5 seconds and reconnect
            console.log("Reconnectiong...");
            EstablishWebsocketConnection(callback);

        }, 5000);
    }
}

function pushAppState() {
    // Copy and serialize Application state
    let state = JSON.parse(JSON.stringify(ApplicationState))
    // serialize streamers
    for (let i in state.streamers) {
        state.streamers[i] = state.streamers[i].serialize();
    }


    ws.send(JSON.stringify({
        type: "AppState",
        content: state
    }));
}