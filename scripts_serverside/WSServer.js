// const WebSocket = require('ws');
const {v4: uuidv4} = require('uuid');
// const ws = new WebSocket.Server({
//     server: app,
//     path: "/cnxtn",
//     // port:8000
// });


const DEFAULT_CLIENT_STATE = {
    id: null,
    headpose: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1]
    ],
    following: false,
    streamers: [
        // {
        //     uri: "http://192.168.1.100:3000/assets/samplevid.mp4",
        //     transform: [
        //         1, 0, 0, 0,
        //         0, 1, 0, 0,
        //         0, 0, 1, 0,
        //         0, 2, 0, 1
        //     ]
        // }
    ],
    play_area: {
        "border":[
            [1, 0, 1],
            [1, 0, -1],
            [-1, 0, -1],
            [-1, 0, 1]
        ],
        "islands":[]
    },
    environment: "forest",
    room: "118218",
    xr: false
  }
  
  var AppState = {
    clients: []
  };
  


let connections = [];
function onClientConnect(conn) {
    conn.on('message', function(raw) {
        onMessage(conn, raw);
    })
    conn.on('close', function() {
        onClose(conn);
    })
}

function onMessage(conn, rawMessage) {
    let msg;
    try {
        msg = JSON.parse(rawMessage);
    }
    catch {
        console.error("[WSServer] Failed to parse message as JSON.");
        console.log(rawMessage);
    }

    let type = msg.type.toUpperCase();

    if (conn.SRSLy_Verified || type === "SETUP") {
        let client_index = getClientIndex(conn.SRSLy_id);
        let client_state = getClientState(conn.SRSLy_id);
        switch(type) {
            case "PING":
                console.log("ping-ed");
                send(conn, JSON.stringify({
                    type: "PONG",
                    message: rawMessage
                }));
                break;
            case "LOG":
                console.log("[LOG]", msg.data);
                break;
            case "POSE":
                // update client's headpose
                AppState.clients[client_index].headpose = msg.world.head;
                bcast(rawMessage, conn);

                // TODO: accumulate poses from all clients and send as one packet
                break;
            case "APPSTATE":
                AppState.clients[client_index] = msg.content;
                break;
            case "SETUP":
                verifyClient(conn, msg);
                break;
            case "BCAST":
            case "BROADCAST":
            case "RTC SOCKET ID":
            default:
                bcast(rawMessage, conn);
                console.log("[WebSocket]", type, "message was forwarded to other clients");
                break;
        }
    }
    else {
        kick(conn);
        // console.warn("[Websocket] No setup message send to validate socket", rawMessage);
    }
}

function onClose(conn) {
    console.log("[Websocket] Connection with", conn.SRSLy_id, "closed");
    bcast(JSON.stringify({
        "type": "PEER DISCONNECT",
        "id": conn.SRSLy_id
    }));
    connections.splice(connections.indexOf(conn), 1);
}

function send(conn, message) {
    if ('emit' in conn) {
        conn.emit("srslyMessage", message);
    }
    else {
        conn.send(message);
    }
}

/**
 * Forwards a message from a sender to all of the other connected clients
 * @param {object} sender The connection object that send the broadcast request
 * @param {string} rawMessage The message to broadcast
 */
function bcast(rawMessage, sender=null) {
    for (let conn of connections) {
        if (!sender || conn !== sender) {
            send(conn, rawMessage);
        }
    }
}

/**
 * Verifies that the websocket client sent a valid setup message.
 * If valid, adds to the list of registered connections.
 * If invalid, boots from server.
 * @param {object} conn The websocket client
 * @param {string} setupMessage the parsed message form the client including a 'key' property.
 */
function verifyClient(conn, setupMessage) {
    if (typeof(setupMessage.key) === 'string'){
        if (setupMessage.key === 'SRSLy bro, just let me in. I got stuff I need to send.') {
            // Flag as verified
            conn["SRSLy_Verified"] = true;

            // Assign ID
            let id = uuidv4();
            let state = DEFAULT_CLIENT_STATE;


            if ("id" in setupMessage) {
                id = setupMessage.id;
                // check for known client state
                for (let client of AppState.clients) {
                    if (client.id && client.id === id) {
                        state = client;
                    }
                }
            }
            conn["SRSLy_id"] = id;
            state.id = id;
            
            send(conn, JSON.stringify({
                type:"VERIFIED",
                uuid: id,
                state: state
            }));

            // Add to list of known connections
            connections.push(conn);
            AppState.clients.push(DEFAULT_CLIENT_STATE);
            console.log("[Websocket] Verified client", id);
            return;
        }
    }

    // else
    kick(conn);
    console.warn("[Websocket] Invalid Passkey");
}

function kick(conn) {
    conn.SRSLy_Verified = false;
    try {
        conn.close();
    }
    catch {
        try{
            conn.disconnect();
        }
        catch {
            console.log("Failed to kick")
        }
    }
}

function getClientState(id) {
    return AppState.clients[getClientIndex(id)]
}

function getClientIndex(id) {
    return connections.map(c => c.SRSLy_id).indexOf(id);
}

module.exports = {
    AppState: AppState,
    onClientConnect: onClientConnect,
    onMessage: onMessage,
    onClose: onClose
}