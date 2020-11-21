
/**
 * server mediasoup code for webrtc
 * https://github.com/Dirvann/mediasoup-sfu-webrtc-video-rooms
 *  
 */ 

module.exports = class Peer {

    // Each peer should have a copy of transports it uses including the consumers and producers
    constructor(socket_id, name) {
        this.id = socket_id
        this.name = name
        this.transports = new Map()
        this.consumers = new Map()
        this.producers = new Map()
    }


    // stores a transport given to a user to transports
    addTransport(transport) {
        this.transports.set(transport.id, transport)
    }

    // connect a user's transport to the server
    async connectTransport(transport_id, dtlsParameters) {
        if (!this.transports.has(transport_id)) return
        await this.transports.get(transport_id).connect({
            dtlsParameters: dtlsParameters
        });
    }

    // createProducer used to get the transports and make them into producers
    async createProducer(producerTransportId, rtpParameters, kind) {
        //TODO handle null errors
        let producer = await this.transports.get(producerTransportId).produce({
            kind,
            rtpParameters
        })

        this.producers.set(producer.id, producer)

        producer.on('transportclose', function() {
            console.log(`---producer transport close--- name: ${this.name} consumer_id: ${producer.id}`)
            producer.close()
            this.producers.delete(producer.id)
            
        }.bind(this))

        return producer
    }

    // createConsumer used to get the transports and make them into consumers
    async createConsumer(consumer_transport_id, producer_id, rtpCapabilities) {
        let consumerTransport = this.transports.get(consumer_transport_id)

        let consumer = null
        try {
            consumer = await consumerTransport.consume({
                producerId: producer_id,
                rtpCapabilities,
                paused: false //producer.kind === 'video',
            });
        } catch (error) {
            console.error('consume failed', error);
            return;
        }

        if (consumer.type === 'simulcast') {
            await consumer.setPreferredLayers({
                spatialLayer: 2,
                temporalLayer: 2
            });
        }

        this.consumers.set(consumer.id, consumer)

        consumer.on('transportclose', function() {
            console.log(`---consumer transport close--- name: ${this.name} consumer_id: ${consumer.id}`)
            this.consumers.delete(consumer.id)
        }.bind(this))

        

        return {
            consumer,
            params: {
                producerId: producer_id,
                id: consumer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                type: consumer.type,
                producerPaused: consumer.producerPaused
            }
        }
    }

    // Close the producer if the user doesn't need to send any more data
    closeProducer(producer_id) {
        try {
            this.producers.get(producer_id).close()
        } catch(e) {
            console.warn(e)
        }
    
        
        this.producers.delete(producer_id)
    }

    // Get the Producer obj
    getProducer(producer_id) {
        return this.producers.get(producer_id)
    }

    // remove the user, just close all transports
    close() {
        this.transports.forEach(transport => transport.close())
    }

    // Remove consumer obj from the user (happens when producer closes)
    removeConsumer(consumer_id) {
        this.consumers.delete(consumer_id)
    }

}