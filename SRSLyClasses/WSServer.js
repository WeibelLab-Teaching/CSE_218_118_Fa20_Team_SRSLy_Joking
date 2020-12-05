const WebSocket = require('ws');
const {v4: uuidv4} = require('uuid');
const wss = new WebSocket.Server({
    port:8000
});


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
    play_area: [
        [1, 0, 1],
        [1, 0, -1],
        [-1, 0, -1],
        [-1, 0, 1]
    ],
    environment: "forest",
    room: "118218",
    xr: false
  }
  
  var AppState = {
    clients: []
  };
  


let connections = [];
wss.on('connection', function(conn) {



    conn.on('message', function(rawMessage) {
        let msg = JSON.parse(rawMessage);
        let type = msg.type.toUpperCase();

        if (conn.SRSLy_Verified || type === "SETUP") {
            let client_index = getClientIndex(conn.SRSLy_id);
            let client_state = getClientState(conn.SRSLy_id);
            switch(type) {

                case "POSE":
                    // update client's headpose
                    AppState.clients[client_index].headpose = msg.head;
                    // broadcast pose
                    msg["id"] = conn.SRSLy_id;
                    bcast(conn, JSON.stringify(msg));

                    // TODO: accumulate poses from all clients and send as one packet
                    break;
                case "APPSTATE":
                    AppState.clients[client_index] = msg.content;
                    break;
                case "RTC SOCKET ID":
                    bcast(conn, JSON.stringify(msg));
                    break;
                case "BCAST":
                case "BROADCAST":
                    bcast(rawMessage);
                    break;
                case "SETUP":
                    verifyClient(conn, msg);
                    break;
                default:
                    console.error("[WebSocket] Unknown message type", type, "contents:", msg);
                    break;
            }
        }
        else {
            conn.close();
            console.warn("[Websocket] No setup message send to validate socket", rawMessage);
        }
    })



    conn.on('close', function() {
        console.log("[Websocket] Connection with", conn.SRSLy_id, "closed");
        connections.splice(connections.indexOf(conn), 1);
    })
})

/**
 * Forwards a message from a sender to all of the other connected clients
 * @param {object} sender The connection object that send the broadcast request
 * @param {string} rawMessage The message to broadcast
 */
function bcast(sender, rawMessage) {
    for (let conn of connections) {
        if (sender && conn !== sender) {
            conn.send(rawMessage);
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
            
            conn.send(JSON.stringify({
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
    conn.close();
    console.warn("[Websocket] Invalid Passkey");
}

function getClientState(id) {
    return AppState.clients[getClientIndex(id)]
}

function getClientIndex(id) {
    return connections.map(c => c.SRSLy_id).indexOf(id);
}

module.exports = {
    AppState: AppState,
}