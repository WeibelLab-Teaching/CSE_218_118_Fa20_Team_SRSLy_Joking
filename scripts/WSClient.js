var ws

/**
 * Connects to the server. Callback is never run if an error occurs.
 * @param {function} callback Once verified by the server, run this callback and pass the websocket.
 */
function EstablishWebsocketConnection(callback) {
    ws = new WebSocket("ws://" + window.location.hostname + ":8000");

    ws.onopen = function() {
        console.log("[Websocket] Established connection");
        ws.send(JSON.stringify({
            "type": "SETUP",
            "key": "SRSLy bro, just let me in. I got stuff I need to send."
        }))
    }

    ws.onmessage = function (rawMessage) {
        msg = JSON.parse(rawMessage.data);
        type = msg.type.toUpperCase();

        switch(type) {
            case "VERIFIED":
                console.log("[Websocket] Verified", msg);
                SetApplicationState(msg.state);
                ApplicationState = msg.state;
                callback(ws);
                break;
            default:
                console.error("[Websocket] Unknown message received from server of", type, "type. Contents:", msg);
                break;
        }
    }

    ws.onerror = function(error) {
        console.error("[Websocket] error", error);
    }
}


/**
 * Sends the user's headpose to the other connected users.
 * @param {4x4 matrix} transform The transformation matrix of the head
 */
function sendHeadPose(transform) {
    // Get Head Pose
    camera = scene.cameras.filter(c=>c.name==="deviceOrientationVRHelper");

    ws.send(JSON.stringify({
        type:"HEADPOSE",
        T: transform
    }))
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