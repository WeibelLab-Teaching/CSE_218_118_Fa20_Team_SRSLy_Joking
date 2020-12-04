/* Most of the code here is from https://github.com/Dirvann/mediasoup-sfu-webrtc-video-rooms to implement
 * webrtc features.
 */

if (location.href.substr(0, 5) !== 'https')
  location.href = 'https' + location.href.substr(4, location.href.length - 4)

const socket = io()


let producer = null;

// nameInput.value = 'bob' + Math.round(Math.random() * 1000)

socket.request = function request(type, data = {}) {
  return new Promise((resolve, reject) => {
    socket.emit(type, data, (data) => {
      if (data.error) {
        reject(data.error)
      } else {
        resolve(data)
      }
    })
  })
}

let rc = null

function joinRoom(name, room_id) {
  if (rc && rc.isOpen()) {
    console.log('already connected to a room')
  } else {
    rc = new RoomClient(streams, streams, remoteAudios, window.mediasoupClient, socket, room_id, name, roomOpen)

    addListeners()
  }

}

function roomOpen() {
  login.className = 'hidden'
  reveal(startAudioButton)
  hide(stopAudioButton)
  reveal(startVideoButton)
  hide(stopVideoButton)
  reveal(startScreenButton)
  hide(stopScreenButton)
  reveal(exitButton)
  control.className = ''
  reveal(videoMedia)
}

function hide(elem) {
  elem.className = 'hidden'
}

function reveal(elem) {
  elem.className = ''
}


function addListeners() {
  rc.on(RoomClient.EVENTS.startScreen, () => {
    hide(startScreenButton)
    reveal(stopScreenButton)
  })

  rc.on(RoomClient.EVENTS.stopScreen, () => {
    hide(stopScreenButton)
    reveal(startScreenButton)

  })

  rc.on(RoomClient.EVENTS.stopAudio, () => {
    hide(stopAudioButton)
    reveal(startAudioButton)

  })
  rc.on(RoomClient.EVENTS.startAudio, () => {
    hide(startAudioButton)
    reveal(stopAudioButton)
  })

  rc.on(RoomClient.EVENTS.startVideo, () => {
    hide(startVideoButton)
    reveal(stopVideoButton)
  })
  rc.on(RoomClient.EVENTS.stopVideo, () => {
    hide(stopVideoButton)
    reveal(startVideoButton)
  })
  rc.on(RoomClient.EVENTS.exitRoom, () => {
    hide(control)
    reveal(login)
    hide(videoMedia)
  })
}

// Load mediaDevice options
navigator.mediaDevices.enumerateDevices().then(devices =>
  devices.forEach(device => {
    let el = null
    if ('audioinput' === device.kind) {
      el = audioSelect
    } else if ('videoinput' === device.kind) {
      el = videoSelect
    }
    if(!el) return

    let option = document.createElement('option')
    option.value = device.deviceId
    option.innerText = device.label
    el.appendChild(option)
  })
)


/*
================================================================================
    Managing Peer events
================================================================================
Some functions for helping will callbacks and
identifying peers with their websocket id based on their consumer/producer id

onConnectionEstablished/Broken are lists of callback functions
ConsumerProducerPairs (CPPairs) relate consumer and producer ids
producer ids are the websocket uuid or the 'username'. Consumer ids are unique.

When a new peer connects, we need to create a new streamer
When it disconnects, we need to destroy the streamer we created.
*/

onConnectionEstablished = []
onConnectionBroken = []
ConsumerProducerPairs = []

// Setup callback functions for when users connect and disconnect
socket.on('newProducers', function (data) {
  // Broadcast your own identification info to peers
  announceIds();
  if (data.length === 0) return;

  createCPPair(data);
  // Run misc callbacks
  for (let callback of onConnectionEstablished) {
    callback(data[0].producer_id);
  }
});

socket.on('newConsumers', function(data) {
  console.log("Got a new consumer", data);
})

socket.on("consumerClosed", function({consumer_id}) {
  // Remove consumer from list
  let pair = GetCPPair(null, consumer_id).pair;
  if (pair) {
    console.log("CONSUMER CLOSED", consumer_id, "\n", pair);
    trimCPPair(null, consumer_id, pair);
  }
  else {
    console.warn("Unrecorded consumer was closed", consumer_id);
  }

  for (let callback of onConnectionBroken) {
    callback(consumer_id);
  }
})

/**
 * Pairs a pid with a cid (multiple pids and cids can relate)
 * @param {string} pdata the webrtc RoomClient procuder info including producer_id and socket_id
 */
async function createCPPair(pidata) {
  let pid = pidata[0].producer_id;
  let sid = pidata[0].producer_socket_id;
  console.log("Producer ID", pid, "sid", sid);

  let stream = await rc.getConsumeStream(pid);
  let cid = stream.consumer._id;

  // Check if a CPPair with the pid exists
  let {pair, matched} = GetCPPair(pid, cid, sid);
  console.log("Found pair", pair, matched);
  if (pair) {
    switch (matched) {
      case "producer":
        pair.consumers.push(cid);
        break;
      case "consumers":
        pair.producers.push(pid);
        break;
      case "socket":
        pair.producers.push(pid);
        pair.consumers.push(cid);
        break;
    }
  }
  else {
    pair = generateCPPair(pid, cid, sid);
  }
}

function generateCPPair(pid=undefined, cid=undefined, sid=undefined, wsid=undefined, xr=false) {
  let pair = {
    "producers": [],
    "socket": sid,
    "consumers": [],
    "wsid": wsid,
    "xr": xr
  }
  if (pid) {
    pair.producers.push(pid);
  }
  if (cid) {
    pair.consumers.push(cid);
  }

  ConsumerProducerPairs.push(pair);
  return pair;
}

async function trimCPPair(pid=undefined, cid=undefined, pair=undefined) {
  // Check valid inputs
  if (!pid && !cid) {
    throw new Error("Must provide pid or cid");
  }

  // Get the pairing if needed
  if (!pair) {
    pair = GetCPPair(pid, cid).pair;
  }

  // Get the pid and cid as needed
  let i=0;
  if (!pid) {
    i = pair.consumers.indexOf(cid);
  }
  if (!cid) {
    i = pair.prodcuers.indexOf(pid);
  }

  // Trim
  console.log("Trimming pair", pair, "consumer and producers at index", i);
  pair.consumers.splice(i, 1);
  pair.producers.splice(i, 1);
}

async function removeCPPair(pid=null, cid=null, sid=null, wsid=null) {
  if (!pid && !cid && !sid && !wsid) {
    throw new Error("Must pass one of pid, cid, side, or wsid");
  }

  if (pid) {
    ConsumerProducerPairs = ConsumerProducerPairs.filter(p=>p.prodcuers.indexOf(pid)===-1);
  }
  else if (cid) {
    ConsumerProducerPairs = ConsumerProducerPairs.filter(p=>p.consumers.indexOf(cid)===-1);
  }
  else if (sid) {
    ConsumerProducerPairs = ConsumerProducerPairs.filter(p=>p.socket!==sid);
  }
  else {
    ConsumerProducerPairs = ConsumerProducerPairs.filter(p=>p.wsid!==wsid);
  }
}

/**
 * Get's the pair that a consumer OR producer belongs to. 
 * Only pass one of pid, cid, sid (later elements will be ignored).
 * @param {string | null} pid The Producer Id to match.
 * @param {string | null} cid The Consumer Id to match.
 * @param {string | null} sid The socket Id to match.
 * @return {{producers:[], consumers:[]}} a Consumer Producer Pair
 */
function GetCPPair(pid=null, cid=null, sid=null){
  let pair;
  let matched;
  if (!pair && pid) {
    pair = ConsumerProducerPairs.filter(p=>p.producers.indexOf(pid)!==-1)[0];
    matched = "producers";
  }
  if (!pair && cid) {
    pair = ConsumerProducerPairs.filter(p=>p.consumers.indexOf(cid)!==-1)[0];
    matched = "consumers";
  }
  if (!pair && sid) {
    pair = ConsumerProducerPairs.filter(p=>p.socket===sid)[0];
    matched = "socket";
  }

  return {
    pair: pair,
    matched: matched
  }
}


// When a new device connects, broadcast your info
function announceIds() {
  let data = {
    type: "RTC SOCKET ID",
    socketid: rc.socket.id,
    wsid: ApplicationState.id
  }
  console.log("Sending WebRTC Socket ID", data);
  ws.send(JSON.stringify(data))
}
// onConnectionEstablished.push(announceIds); // -- inserted into the main callback.

// creation/destruction of steamers
// onConnectionEstablished.push(addStreamer);
// onConnectionBroken.push(removeStreamer);