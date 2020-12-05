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


    // ==========	Creating and Destroying	==========
    // constructor, destructor, serialize, deserialize
    constructor(scene, momentum, pair, position=undefined) {
        this.name = "Streamer" + ApplicationState.streamers.length;
        this.scene = scene;
        this.mesh = new BABYLON.TransformNode(this.name+"_Mesh", this.scene);
        this.videoSrc = undefined;
        this.audioSrc = undefined;
        this.pcpair = pair;
        this.xr = undefined;

        // Set/Generate Position
        if (position) {
            this.mesh.position = position;
        }
        else {
            position = new BABYLON.Vector3(Math.random(-.5, .5), 2, Math.random(0.5, 1));
        }

        // Setup mesh for following
        this.follower = new Follower(this.mesh, momentum, scene);
        this.follower.billboard(true);

        // Add to list
        console.log("[Streamer] Created Streamer", this.name);
        Streamer.streamers.push(this);
    }

    destructor() {
        // Remove mesh from Scene
        this.mesh.dispose();

        // Remove DOM elements
        for (let elm of this.pcpair.getDOMElements()) {

        }

        // Remove listeners
        this.follower.destructor();
    }


    serialize() {
        return {
            uri: this.src.src,
            avatar: this.avatar,
            transform: this.mesh.getWorldMatrix().toAarray()
        }
    }

    static deserialize(serial) {
        // TODO: Deserialize with avatar


        console.log("Deserializing Streamer", serial);
        let streamsContainer = document.getElementById("streams");
        let video = document.createElement("video");
        video.setAttribute("src", serial.uri);
        streamsContainer.appendChild(video);

        // Set position
        let transformationMatrix = BABYLON.Matrix.FromValues(
            serial.transform[0], serial.transform[1], serial.transform[2], serial.transform[3], 
            serial.transform[4], serial.transform[5], serial.transform[6], serial.transform[7], 
            serial.transform[8], serial.transform[9], serial.transform[10], serial.transform[11], 
            serial.transform[12], serial.transform[13], serial.transform[14], serial.transform[15]);

        // Create Streamer object
        console.log("Creating Streamer at", transformationMatrix.getTranslation());
        let streamer = new Streamer(video, scene, [1920, 1080], 0.3, transformationMatrix.getTranslation());

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