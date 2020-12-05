/*
================================================================================
    Managing Peer events
================================================================================
Some functions for helping will callbacks and
identifying peers with their websocket id based on their consumer/producer id

onConnectionEstablished/Broken are lists of callback functions
PCPair.Pairs (CPPairs) relate consumer and producer ids
producer ids are the websocket uuid or the 'username'. Consumer ids are unique.

When a new peer connects, we need to create a new streamer
When it disconnects, we need to destroy the streamer we created.
*/


class PCPair {
    static Pairs = [];
    static onConnectionEstablished = [];
    static onConnectionBroken = [];
    
    producers = [];
    consumers = [];
    socket;
    websocket;
    xr;

    constructor(pid=undefined, cid=undefined, sid=undefined, wsid=undefined, xr=false) {
        this.producers = [],
        this.socket = sid,
        this.consumers = [],
        this.websocket = wsid,
        this.xr = xr
        
        if (pid) {
            this.producers.push(pid);
        }
        if (cid) {
            this.consumers.push(cid);
        }

        PCPair.Pairs.push(this);
    }

    getDOMElements() {
        let elms = [];
        for (let consumer of this.consumers) {
            elms.push(document.getElementById(consumer));
        }
        return elms;
    }

    getStreamer() {
        for (let streamer of Streamer.streamers) {
            if (streamer.PCPair === this) {
                return streamer
            }
        }
        return null;
    }

    /**
     * Removes a PCPair from list of managed pairs, given an id to match.
     * @param {string | undefined} pid the producer id to be used to identify the PCPair to delete
     * Must provide one of pid, cid, sid, or wsid
     * @param {string | undefined} cid the consumer id to be used to identify the PCPair to delete
     * Must provide one of pid, cid, sid, or wsid
     * @param {string | undefined} sid the socket id to be used to identify the PCPair to delete
     * Must provide one of pid, cid, sid, or wsid
     * @param {string | undefined} wsid the websocket id to be used to identify the PCPair to delete
     * Must provide one of pid, cid, sid, or wsid
     */
    static destructor(pid=undefined, cid=undefined, sid=undefined, wsid=undefined) {
        if (!pid && !cid && !sid && !wsid) {
            throw new Error("Must pass one of pid, cid, side, or wsid into destructor");
        }

        if (pid) {
            PCPair.Pairs = PCPair.Pairs.filter(p=>p.prodcuers.indexOf(pid)===-1);
        }
        else if (cid) {
            PCPair.Pairs = PCPair.Pairs.filter(p=>p.consumers.indexOf(cid)===-1);
        }
        else if (sid) {
            PCPair.Pairs = PCPair.Pairs.filter(p=>p.socket!==sid);
        }
        else {
            PCPair.Pairs = PCPair.Pairs.filter(p=>p.websocket!==wsid);
        }
    }

    /**
     * Broadcasts a message to all websocket connections informing of
     * socket id - the unique webrtc socket id for this device
     * websocket id - the unique websocket id for this device
     * This lets other devices relate websocket information and webrtc socket information
     * eg: Making someone's audio (webrtc socket) come from the correct avatar (websocket).
     */
    static announceIds() {
        let data = {
            type: "RTC SOCKET ID",
            socketid: rc.socket.id,
            wsid: ApplicationState.id,
            xr: true
        }
        // console.log("[PCPair] Sending WebRTC Socket ID", data);
        ws.send(JSON.stringify(data))
    }


    /**
     * Either creates a new PCPair or adds the new data to an existing pair.
     * If the socket id, producer id, or the consumer id tied to the producer match an existing pair,
     * the new producer, consumer, and socket ids will be added to it.
     * Otherwise, it will create a new PCPair and add it to the PCPair.Pairs array.
     * @param {[{producer_id:string, producer_socket_id:string}]} pidata WebRTC data returned when a new producer arrives
     */
    static async create(pidata) {
        let pid = pidata[0].producer_id;
        let sid = pidata[0].producer_socket_id;
        console.log("[PCPair] Producer ID", pid, "sid", sid);

        setTimeout(async function() {
            let stream = await rc.getConsumeStream(pid);
            let elmid = document.getElementById("remoteAudios").getElementsByTagName("audio")[0].id
            let cid = elmid; //stream.consumer._id;

            // ALTERNATIVELY
            // console.log("[PCPair] Looking for real cid. Originally set to", cid);
            // console.log("Rc Consumers", rc.consumers);
            // rc.consumers.forEach(function (consumer) {
            //     console.warn("Checking", consumer);
            //     if (consumer._producerId === pid) {
            //         cid = consumer._id;
            //         console.log("Found real", consumer._id);
            //         return;
            //     }
            // })
            // console.log("Updated to", cid);

            // Check if a CPPair with the pid exists
            let {pair, matched} = PCPair.get(pid, cid, sid);
            console.log("[PCPair] Found pair", pair, matched);
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
                pair = new PCPair(pid, cid, sid);
            }
        }.bind(pid, sid, document), 100)
    }

    /**
     * Trims a producer and consumer from a PCPairs tracked ids.
     * Pass in EITHER a pid or cid to remove that element
     * and its corresponding cid or pid.
     * @param {string | undefined} pid the webrtc producer id to remove
     * @param {string | undefined} cid the webrtc consumer id to remove
     * @param {PCPair} pair (optional) the pair managing the producer/consumer
     */
    static trim(pid=undefined, cid=undefined, pair=undefined) {
        // Check valid inputs
        if (!pid && !cid) {
            throw new Error("Must provide pid or cid");
        }

        // Get the pairing if needed
        if (!pair) {
            pair = PCPair.get(pid, cid).pair;
        }

        // Get the pid and cid as needed
        let i=0;
        if (!pid) {
            i = pair.consumers.indexOf(cid);
        }
        else {
            i = pair.prodcuers.indexOf(pid);
        }

        // Trim
        console.log("Trimming pair", pair, "consumer and producers at index", i);
        let c = pair.consumers.splice(i, 1);
        let p = pair.producers.splice(i, 1);
        return {consumer: c, producer: p}
    }

    /**
     * Get's the PCPair that a consumer OR producer belongs to. 
     * Only pass one of pid, cid, sid (later elements will be ignored).
     * @param {string | undefined} pid The Producer Id to match.
     * @param {string | undefined} cid The Consumer Id to match.
     * @param {string | undefined} sid The socket Id to match.
     * @param {string | undefined} wsid the websocket id to match.
     * @return {PCPair, string} the matching pair as well as the element that was matched ('consumer', 'producer', etc)
     */
    static get(pid=undefined, cid=undefined, sid=undefined, wsid=undefined){
        let pair;
        let matched;
        if (!pair && pid) {
            pair = PCPair.Pairs.filter(p=>p.producers.indexOf(pid)!==-1)[0];
            matched = "producers";
        }
        if (!pair && cid) {
            pair = PCPair.Pairs.filter(p=>p.consumers.indexOf(cid)!==-1)[0];
            matched = "consumers";
        }
        if (!pair && sid) {
            pair = PCPair.Pairs.filter(p=>p.socket===sid)[0];
            matched = "socket";
        }
        if(!pair && wsid) {
            pair = PCPair.Pairs.filter(p=>p.websocket===wsid)[0];
            matched = "websocket";
        }

        return {
            pair: pair,
            matched: matched
        }
    }


    // ==========	WebRTC Callback Executors	==========
    // Functions which manage what gets called when a connection forms/drops/updates


    static _newProducerCallbackExecutor(data) {
        // Broadcast your own identification info to peers
        PCPair.announceIds();
        if (data.length === 0) return;

        PCPair.create(data);
        // Run misc callbacks
        for (let callback of PCPair.onConnectionEstablished) {
            callback(data[0].producer_id);
        }
    }

    static _newConsumerCallbackExecutor(data) {
        console.log("[PCPair] got new consumer", data);
    }

    static _closeConsumerCallbackExecutor({consumer_id}) {
        // Remove consumer from list
        let pair = PCPair.get(null, consumer_id).pair;
        if (pair) {
            console.log("CONSUMER CLOSED", consumer_id, "\n", pair);
            PCPair.trim(null, consumer_id, pair);
        }
        else {
            console.warn("Unrecorded consumer was closed", consumer_id);
        }

        for (let callback of PCPair.onConnectionBroken) {
            callback(consumer_id);
        }
    }
}