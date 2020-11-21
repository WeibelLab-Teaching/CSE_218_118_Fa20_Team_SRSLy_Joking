
/**
 * server mediasoup code for webrtc
 * https://github.com/Dirvann/mediasoup-sfu-webrtc-video-rooms
 *  
 */ 

const config = require('./config')


module.exports = class Room {

    // When creating a new room object
    constructor(room_id, worker, io) {
        this.id = room_id
        const mediaCodecs = config.mediasoup.router.mediaCodecs

        // This router is used to create transports in the server
        worker.createRouter({
            mediaCodecs
        }).then(function (router) {
            this.router = router
        }.bind(this))

        this.peers = new Map()
        this.io = io
    }

    // to add another user to the list
    addPeer(peer) {
        this.peers.set(peer.id, peer)
    }

    // to obtain the members in the room for the new user
    getProducerListForPeer(socket_id) {
        let producerList = []
        this.peers.forEach(peer => {
            peer.producers.forEach(producer => {
                producerList.push({
                    producer_id: producer.id
                })
            })
        })
        return producerList
    }

    // get the capabilities for the router (room)
    getRtpCapabilities() {
        return this.router.rtpCapabilities
    }

    // Create a new webrtc transport (consume/produce) for the user
    async createWebRtcTransport(socket_id) {
        const {
            maxIncomingBitrate,
            initialAvailableOutgoingBitrate
        } = config.mediasoup.webRtcTransport;

        // Creates a new transport using mediasoup router
        const transport = await this.router.createWebRtcTransport({
            listenIps: config.mediasoup.webRtcTransport.listenIps,
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate,
        });

        // if the bitrate is a valid number and not zero, set it. 
        if (maxIncomingBitrate) {
            try {
                await transport.setMaxIncomingBitrate(maxIncomingBitrate);
            } catch (error) {}
        }

        // Datagram Transport Layer Security (DTLS) state change
        transport.on('dtlsstatechange', function(dtlsState) {

            if (dtlsState === 'closed') {
                console.log('---transport close--- ' + this.peers.get(socket_id).name + ' closed')
                transport.close()
            }
        }.bind(this))

        // Closing transport (i.e. user is gone)
        transport.on('close', () => {
            console.log('---transport close--- ' + this.peers.get(socket_id).name + ' closed')
        })

        // Create the transport and add it as one of the user's transport
        console.log('---adding transport---', transport.id)
        this.peers.get(socket_id).addTransport(transport)
        return {
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters
            },
        };
    }

    // this method will connect the transport to the server using the dtlsParameters from the connect event sent from the server when the user does .createSendTransport.
    async connectPeerTransport(socket_id, transport_id, dtlsParameters) {
        if (!this.peers.has(socket_id)) return

        // Gets the .createSendTransport objecy's transport_id from client and connects it to the server's transport created from the above method createWebRtcTransport.
        await this.peers.get(socket_id).connectTransport(transport_id, dtlsParameters)

    }

    // produce method used to create a Producer for a specific transport 
    async produce(socket_id, producerTransportId, rtpParameters, kind) {
        // handle undefined errors
        return new Promise(async function (resolve, reject) {

            // CreateProducer = help method to create a producer for this transport (server will use this to get data from user)
            let producer = await this.peers.get(socket_id).createProducer(producerTransportId, rtpParameters, kind)
            resolve(producer.id)
            this.broadcast(socket_id, 'newProducers', [{
                producer_id: producer.id,
                producer_socket_id: socket_id
            }])
        }.bind(this))
    }

    // Consume method used to create a Consumer for a specific transport and getting data from a specific producer.
    async consume(socket_id, consumer_transport_id, producer_id,  rtpCapabilities) {
        // handle nulls
        if (!this.router.canConsume({
                producerId: producer_id,
                rtpCapabilities,
            })) {
            console.error('can not consume');
            return;
        }

        // Create consumer for this person to consume media
        let {consumer, params} = await this.peers.get(socket_id).createConsumer(consumer_transport_id, producer_id, rtpCapabilities)
        
        // If the producer providing the data closes:
        consumer.on('producerclose', function(){
            console.log(`---consumer closed--- due to producerclose event  name:${this.peers.get(socket_id).name} consumer_id: ${consumer.id}`)
            this.peers.get(socket_id).removeConsumer(consumer.id)
            // tell client consumer is dead
            this.io.to(socket_id).emit('consumerClosed', {
                consumer_id: consumer.id
            })
        }.bind(this))

        return params

    }

    // Remove a person from this room
    async removePeer(socket_id) {
        this.peers.get(socket_id).close()
        this.peers.delete(socket_id)
    }

    // closes a producer given a producer's id
    closeProducer(socket_id, producer_id) {
        this.peers.get(socket_id).closeProducer(producer_id)
    }

    // tells everyone BUT the person who just came in this data.
    broadcast(socket_id, name, data) {
        for (let otherID of Array.from(this.peers.keys()).filter(id => id !== socket_id)) {
            this.send(otherID, name, data)
        }
    }

    // Used to send an io event and its data to a specific socket_id (user)
    send(socket_id, name, data) {
        this.io.to(socket_id).emit(name, data)
    }

    // returns all the people in this room
    getPeers(){
        return this.peers
    }


    // takes a room and makes the data into a json
    toJson() {
        return {
            id: this.id,
            peers: JSON.stringify([...this.peers])
        }
    }


}