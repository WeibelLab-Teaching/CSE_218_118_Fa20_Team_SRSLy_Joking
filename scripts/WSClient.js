
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
        // console.log("[Websocket] Established connection");
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
                /* When the server confirms that the client has access to server 
                passes an app state with an id in it. */

                // console.log("[Websocket] Verified", msg);
                SetApplicationState(msg.state);
                ApplicationState = msg.state;
                callback(ws);
                break;
            case "RTC SOCKET ID":
                /* When a webrtc client sends its webrtc socket id
                This lets us pair webrtc data with websocket data */

                // Update CPPairs
                pcpair = PCPair.get(null, null, msg.socketid, msg.wsid).pair;
                let rtc_socket_id_isNewPCPair = false;

                // If it's a new connection, generate pair and announce your own id
                if (!pcpair) {
                    pcpair = new PCPair(undefined, undefined, msg.socketid, msg.wsid, msg.xr);
                    PCPair.announceIds();
                    rtc_socket_id_isNewPCPair = true;
                }

                // Setup or update streamer
                streamer = pcpair.streamer;

                // Destroy streamer if its status has changed
                if (streamer && msg.xr !== streamer.xr) {
                    streamer.destructor();
                    streamer = "reset";
                }

                // Build a streamer if needed
                if ((!streamer && rtc_socket_id_isNewPCPair) || streamer==="reset") {
                    if (msg.xr) {
                        streamer = new AvatarStreamer(scene, p, pcpair, undefined, msg.avatarModel);
                        console.log("[Websocket] created avatar streamer", streamer);
                    }
                    else {
                        streamer = new VideoStreamer(scene, p, pcpair);
                        console.log("[Websocket] created video streamer", streamer);
                    }
                }
                    
                break;
            case "POSE":
                /* User pose sent for updating avatars */

                // console.log(msg.id, "sent pose", msg.head);
                break;
            case "REFRESH":
                /* Unused */
                window.location.reload();
                break;
            case "LEFT ROOM":
                /* When a peer leaves a webrtc room */
            case "PEER DISCONNECT":
                /* When a peer loses connection to the server,
                presumably because they closed their browser */

                // destroy the pair (automatically destroys attached streamers)
                PCPair.destroy(null, null, null, msg.id);
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