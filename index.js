const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');

const WSServer = require("./SRSLyClasses/WSServer.js");
var AppState = WSServer.AppState;
const WebSocket = require('ws');
// const expressWs = require("express-ws");

var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
// var logger = require('morgan');

const app = express();
const { networkInterfaces } = require('os');

const PORT = 3000;


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));


// Page Table
app.get('/', (req, res) => {
    res.sendFile(__dirname+"/pages/main.html");
    console.log("sent main.html");
})

// WebRTC testing
app.get('/webrtc', (req, res) => {
    res.sendFile(__dirname+"/pages/webrtc.html");
    console.log("sent webrtc.html");
})

// WebRTC nonVR testing
app.get('/webrtc_nonvr', (req, res) => {
    res.sendFile(__dirname+"/pages/webrtc_nonvr.html");
    console.log("sent webrtc_nonvr.html");
})

app.use("/js", express.static(__dirname+'/scripts/'));
app.use("/jquery.js", express.static(__dirname+"/node_modules/jquery/dist/jquery.js"));
app.use("/babylon.js", express.static(__dirname+"/node_modules/babylonjs/babylon.js"));
app.use("/assets", express.static(__dirname+"/assets/"));
app.use("/math.js", express.static(__dirname+"/node_modules/mathjs/lib/browser/math.js"))
app.use("/favicon.ico", express.static(__dirname+"/assets/favicon.ico"));
app.use("/babylon-vrm.js", express.static(__dirname+"/node_modules/babylon-vrm-loader/dist/index.js"));
/*
=====================================
        RUN SERVER
=====================================
*/
http.createServer(app).listen(80);
var httpsServer = https.createServer({ // need https for webcam
    key: fs.readFileSync(__dirname+'/cert/tlsharkey.com.key'),
    cert: fs.readFileSync(__dirname+'/cert/tlsharkey.com.crt')
}, app);

httpsServer.listen(443, (err) => {
    if (err) console.log("Error starting express server");

    // Get IP
    let nets = networkInterfaces();
    let results = Object.create(null); // or just '{}', an empty object
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
    
                results[name].push(net.address);
            }
        }
    }
    console.log(results);
    let ip = results[Object.keys(results)[0]][0]
    console.log("Hosting Server on https://"+ip+":"+PORT.toString());
});



// expressWs(app, httpsServer);
// app.ws("/cnxtn", (ws, req) => {
//     console.log("Websocket connected");
//     WSServer.onClientConnect(ws);
// })
const wss = new WebSocket.Server({
    // server: httpsServer,
    port: 8000
})
wss.on('connection', function(ws) {
    console.log("Websocket Connected");
    WSServer.onClientConnect(ws);
})




/*
================================================================================
        WebRTC
================================================================================
*/

/**
 * server mediasoup code for webrtc
 * https://github.com/Dirvann/mediasoup-sfu-webrtc-video-rooms
 *  
 */ 

const io = require('socket.io')(httpsServer)
const mediasoup = require('mediasoup')
const config = require('./webrtc_server_scripts/config')


// Begin worker methods

// Mediasoup workers
let workers = []
let nextMediasoupIndex = 0

// Initialize the workers asynchronously
;
(async () => {
    await createWorkers()
})()

// function to initialize the workers
async function createWorkers() {

    // Gets the system's cpu count
    let {
        numWorkers
    } = config.mediasoup

    // Initialize a single worker  for each cpu core and put it into the list
    for (let i = 0; i < numWorkers; i++) {

        // Creates a new worker
        let worker = await mediasoup.createWorker({
            logLevel: config.mediasoup.worker.logLevel,
            logTags: config.mediasoup.worker.logTags,
            rtcMinPort: config.mediasoup.worker.rtcMinPort,
            rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
        })

        // if a worker unexpectedly dies, we want to exit that process.
        worker.on('died', () => {
            console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
            setTimeout(() => process.exit(1), 2000);
        })
        workers.push(worker)
    }
}


/**
 * Get next mediasoup Worker. This gets the next worker so that we can 
 * evenly distribute the work among all workers.
 */
function getMediasoupWorker() {
    const worker = workers[nextMediasoupIndex];

    nextMediasoupIndex += 1;
    nextMediasoupIndex %= workers.length;

    return worker;
}


// End worker methods


// Begin room list and initializations

// Each Room is a meeting
const Room = require('./webrtc_server_scripts/Room')

// Each peer is a user
const Peer = require('./webrtc_server_scripts/Peer')
/**
 * roomList
 * {
 *  room_id: Room {
 *      id:
 *      router:
 *      peers: {
 *          id:,
 *          name:,
 *          master: [boolean],
 *          transports: [Map],
 *          producers: [Map],
 *          consumers: [Map],
 *          rtpCapabilities:
 *      }
 *  }
 * }
 */

 // Initialize a room list for all possible rooms by the server
let roomList = new Map()

// on a connection request from the client (i.e. client goes to IP)
io.on('connection', socket => {

    socket.on("srslyMessage", (msg) => {
        WSServer.onMessage(socket, msg);
    })

    // If client wants to create a room.
    socket.on('createRoom', async ({
        room_id
    }, callback) => {
        // Given a room_id, create a room.
        if (roomList.has(room_id)) {
            callback('already exists')
        } else {
            console.log('---created room--- ', room_id)

            // gets a worker for this room
            let worker = await getMediasoupWorker()

            // This list will have a Room object
            roomList.set(room_id, new Room(room_id, worker, io))

            // calls the callback function finally 
            callback(room_id)
        }
    })

    // On a join event to join a room:
    socket.on('join', ({
        room_id,
        name
    }, callback) => {

        // log the user trying to join the room and callback an error if it doesn't exist.
        console.log('---user joined--- \"' + room_id + '\": ' + name)
        if (!roomList.has(room_id)) {
            return callback({
                error: 'room does not exist'
            })
        }

        // Create a peer object to keep track of the user
        roomList.get(room_id).addPeer(new Peer(socket.id, name))
        socket.room_id = room_id

        // Get the Room and callback on that data.
        callback(roomList.get(room_id).toJson())
    })

    // On an event to get the producers of a room, usually called by people joining the call
    socket.on('getProducers', () => {
        console.log(`---get producers--- name:${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)

        // send all the current producer to newly joined member
        if (!roomList.has(socket.room_id)) return

        // getProducerListForPeer simply just gets all the producers for that room
        let producerList = roomList.get(socket.room_id).getProducerListForPeer(socket.id)

        // tells all the other members in the call that there is a new producer
        socket.emit('newProducers', producerList)
    })


    // Client asks for router rtp capabilities
    socket.on('getRouterRtpCapabilities', (_, callback) => {
        console.log(`---get RouterRtpCapabilities--- name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        try {
            callback(roomList.get(socket.room_id).getRtpCapabilities());
        } catch (e) {
            callback({
                error: e.message
            })
        }

    });

    // Client asks to create a webrtc transport for producers and consumer pipes
    socket.on('createWebRtcTransport', async (_, callback) => {
        console.log(`---create webrtc transport--- name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        try {
            const {
                params
            } = await roomList.get(socket.room_id).createWebRtcTransport(socket.id);

            callback(params);
        } catch (err) {
            console.error(err);
            callback({
                error: err.message
            });
        }
    });

    // Connects the transport from the client to the room
    socket.on('connectTransport', async ({
        transport_id,
        dtlsParameters
    }, callback) => {
        console.log(`---connect transport--- name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        if (!roomList.has(socket.room_id)) return
        
        // Gets the room and connects the transport from the client by setting the endpoints
        await roomList.get(socket.room_id).connectPeerTransport(socket.id, transport_id, dtlsParameters)
        
        callback('success')
    })

    // When a client wants to send data to the server (produce media); these parameters will be used by the server to create a Producer instance.
    socket.on('produce', async ({
        kind,
        rtpParameters,
        producerTransportId
    }, callback) => {
        
        if(!roomList.has(socket.room_id)) {
            return callback({error: 'not is a room'})
        }

        // with the transport id, we want to tell the router to receive audio or video RTP
        let producer_id = await roomList.get(socket.room_id).produce(socket.id, producerTransportId, rtpParameters, kind)
        console.log(`---produce--- type: ${kind} name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name} id: ${producer_id}`)
        callback({
            producer_id
        })
    })

    // When a client wants to consume data from the server, to extract media from media soup
    socket.on('consume', async ({
        consumerTransportId,
        producerId,
        rtpCapabilities
    }, callback) => {

        if(!roomList.has(socket.room_id)) {
            return callback({error: 'not is a room'})
        }

        //TODO null handling

        // gets the parameters for Consumer
        let params = await roomList.get(socket.room_id).consume(socket.id, consumerTransportId, producerId, rtpCapabilities)
        
        console.log(`---consuming--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name} prod_id:${producerId} consumer_id:${params.id}`)
        callback(params)
    })

    // ERIC: this is not used at all, maybe used when we want to resume certain streams
    // to continue resumption of a transport 
    // socket.on('resume', async (data, callback) => {

    //     await consumer.resume();
    //     callback();
    // });

    // Obtains a room's info of the client
    socket.on('getMyRoomInfo', (_, cb) => {
        cb(roomList.get(socket.room_id).toJson())
    })

    // When a user disconnets from the room
    socket.on('disconnect', () => {
        console.log(`---disconnect--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        if (!socket.room_id) return
        
        // This removePeer will handle all the required actions to remove the user from the Room
        roomList.get(socket.room_id).removePeer(socket.id)

        WSServer.onClose(socket);
    })

    // when a producer closes (i.e. someone stops sending audio/video)
    socket.on('producerClosed', ({
        producer_id
    }) => {
        console.log(`---producer close--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        roomList.get(socket.room_id).closeProducer(socket.id, producer_id)
    })

    // When someone exits the room
    socket.on('exitRoom', async (_, callback) => {
        console.log(`---exit room--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        if (!roomList.has(socket.room_id)) {
            callback({
                error: 'not currently in a room'
            })
            return
        }

        // close transports;  removePeer will handle all the required actions to remove the user from the Room
        await roomList.get(socket.room_id).removePeer(socket.id)

        // If no one else in the room, delete the room
        if (roomList.get(socket.room_id).getPeers().size === 0) {
            roomList.delete(socket.room_id)
        }

        socket.room_id = null


        callback('successfully exited room')
    })
})

// not used
// function room() {
//     return Object.values(roomList).map(r => {
//         return {
//             router: r.router.id,
//             peers: Object.values(r.peers).map(p => {
//                 return {
//                     name: p.name,
//                 }
//             }),
//             id: r.id
//         }
//     })
// }