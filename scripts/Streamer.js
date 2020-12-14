/*
================================================================================
        Streamer Parent Class
================================================================================
Video and Avatar streamers will inherit from this class

Responsible for:
- managing Audio/Video sources
- managing WebRTC and Websocket unique identifiers
- setting billboarding/following behavior
*/

class Streamer {


    // ==========	Static Properties	==========
    static get streamers() {
        return ApplicationState.streamers;
    }

    // ==========   Instance Properties	==========
    name;
    videoSrc;
    audioSrc;
    scene;
    mesh;
    follower;
    pcpair;
    xr;

    // ==========	Getter and Setter Properties	==========
    get position() {return this.mesh.position;}
    set position(value) {this.mesh.position = value;}
    get rotation() {return this.mesh.rotation;}
    set rotation(value) {this.mesh.rotation = value;}


    // ==========	Creating and Destroying	==========
    // constructor, destructor, serialize, deserialize
    constructor(scene, momentum, pair, position=undefined) {
        this.name = "Streamer" + ApplicationState.streamers.length;
        this.scene = scene;
        this.mesh = new BABYLON.TransformNode(this.name, this.scene);
        this.mesh.scail
        this.videoSrc = undefined;
        this.audioSrc = undefined;
        this.pcpair = pair;
        this.xr = undefined;
        this._disposables = [];
        this._disposables.push(this.mesh);

        // Set/Generate Position
        if (!position) {
            position = new BABYLON.Vector3(Math.random(-.5, .5), 2, Math.random(0.5, 1));
        }
        console.log("[Streamer] Setting node at", position);
        this.mesh.position = position;

        // Setup mesh for following
        this.follower = new Follower(this.mesh, momentum, scene);
        // this.follower.billboard(true);

        // Add to list
        console.log("[Streamer] Created Streamer", this.name);
        Streamer.streamers.push(this);

        // Destroy when WebRTC connection is lost
        this.pcpair.addDestructorCallback(this.destructor.bind(this));
    }

    destructor() {
        // Remove mesh from Scene
        for (let disposable of this._disposables) {
            disposable.dispose();
        }

        // Remove DOM elements - let WebRTC handle this?
        // for (let elm of this.pcpair.getDOMElements()) {

        // }

        // Remove listeners
        this.follower.destructor();

        // Remove from list of streamers
        Streamer.streamers.splice(Streamer.streamers.indexOf(this));
    }


    serialize() {
        return {
            type: "Streamer",
            xr: this.xr,
            transform: this.mesh.getWorldMatrix().toAarray(),
            pair: this.pcpair.serialize()
        }
    }

    static deserializeAmbiguous(scene, momentum, serial) {
        switch (serial.type) {
            case "Streamer":
                return Streamer.deserialize(scene, momentum, serial);
            case "AvatarStreamer":
                return AvatarStreamer.deserialize(scene, momentum, serial);
            case "VideoStreamer":
                return VideoStreamer.deserialize(scene, momentum, serial);
            default:
                console.error("Cannot Deserialize unknown type:", serial.type);
                return null;
        }
    }

    static deserialize(scene, momentum, serial) {
        let pair = PCPair.deserialize(serial.pair);
        let transformationMatrix = BABYLON.Matrix.FromValues(
            serial.transform[0], serial.transform[1], serial.transform[2], serial.transform[3], 
            serial.transform[4], serial.transform[5], serial.transform[6], serial.transform[7], 
            serial.transform[8], serial.transform[9], serial.transform[10], serial.transform[11], 
            serial.transform[12], serial.transform[13], serial.transform[14], serial.transform[15]);


        let streamer = new Streamer(scene, momentum, pair, transformationMatrix.getTranslation());

        // Set to follow
        if (ApplicationState.following) {
            streamer.follower.enable();
        }

        return streamer;
    }

    get position() {
        return this.mesh.absolutePosition;
    }

    get rotation() {
        return this.mesh.absoluteRotationQuaternion;
    }

    toggleFollow() {
        this.follower.toggle();
    }
}