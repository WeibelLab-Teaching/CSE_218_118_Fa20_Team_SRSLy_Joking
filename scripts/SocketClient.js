
var ws = {send: send} // so any other artifacts still send
let temp_ids = []

setTimeout(() => {console.log("SOCKET", socket)}, 100)

function EstablishWebsocketConnection(callback) {

    // Wait until socket is established
    if (typeof(socket) === "undefined") {
        setTimeout(function() {
            setupSrslyListener(callback);
        }, 100);
        return;
    }

    // Implement logic
    socket.on('srslyMessage', function(rawMessage) {
        let msg;
        try {
            msg = JSON.parse(rawMessage);
        }
        catch {
            console.error("Failed to parse message", rawMessage);
            return;
        }

        let type = msg.type.toUpperCase();
        let pcpair;
        let streamer;

        switch(type) {
            case "PONG":
                console.log("Pong-ed", msg);
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
                let rtc_socket_id_streamerPosition = undefined;

                // Destroy streamer if its status has changed
                if (streamer && msg.xr !== streamer.xr) {
                    rtc_socket_id_streamerPosition = streamer.position;
                    streamer.destructor();
                    streamer = "reset";
                }

                // Build a streamer if needed
                if ((!streamer && rtc_socket_id_isNewPCPair) || streamer==="reset") {
                    if (msg.xr) {
                        streamer = new AvatarStreamer(scene, p, pcpair, rtc_socket_id_streamerPosition, msg.avatarModel);
                        console.log("[Websocket] created avatar streamer", streamer);
                    }
                    else {
                        streamer = new VideoStreamer(scene, p, pcpair, rtc_socket_id_streamerPosition);
                        console.log("[Websocket] created video streamer", streamer);
                    }
                }                    
                break;
            case "POSE":
                /* User pose sent for updating avatars */
                streamer = PCPair.get(null, null, null, msg.id).pair
                if (streamer) { // verify pair exists
                    streamer = streamer.streamer;
                }
                else {
                    break;
                }

                if (streamer instanceof AvatarStreamer) {
                    streamer.setAvatarPose(msg);
                }
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
    });

    socket.on('open', function() {
        // send(JSON.stringify({
        //     "type": "SETUP",
        //     "key": "SRSLy bro, just let me in. I got stuff I need to send."
        // }));
    })

    socket.on('end', function() {
        console.error("Disconnected from Socket");
    });


    send(JSON.stringify({
        "type": "SETUP",
        "key": "SRSLy bro, just let me in. I got stuff I need to send."
    }));
}



function send(message) {
    socket.emit("srslyMessage", message);
}

function pushAppState() {
    // Copy and serialize Application state
    let state = {}
    for (let key of Object.keys(ApplicationState)) {
        if (key === "streamers") continue; // skip this one
        state[key] = JSON.parse(JSON.stringify(ApplicationState[key]));
    }
    // serialize streamers
    state["streamers"]=[];
    for (let i in state.streamers) {
        state.streamers[i] = state.streamers[i].serialize();
    }


    ws.send(JSON.stringify({
        type: "AppState",
        content: state
    }));
}