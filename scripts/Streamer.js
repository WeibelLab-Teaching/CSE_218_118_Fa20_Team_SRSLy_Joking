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

    dragAction;
    __dragData;

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
        this.videoSrc = undefined;
        this.audioSrc = undefined;
        this.pcpair = pair;
        this.xr = undefined;
        this._disposables = [];
        this._disposables.push(this.mesh);

        this.__dragHandle = BABYLON.MeshBuilder.CreatePlane(this.name, {width:.2, height:.2}, this.scene);
        this.__dragHandle.parent = this.mesh;
        this.__dragHandle.locallyTranslate(new BABYLON.Vector3(0.4, -0.25, -0.05));
        this.__dragHandle.material = new BABYLON.StandardMaterial("DragHandleMaterial", this.scene);
        this.__dragHandle.material.diffuseTexture = new BABYLON.Texture("assets/axis.png", this.scene);
        this.__dragHandle.material.diffuseTexture.hasAlpha = true;

        // Set/Generate Position
        if (!position) {
            position = new BABYLON.Vector3(Math.random(-1, 1), 2, Math.random(0.5, 3));
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
        if (typeof(this.pcpair) !== "undefined") {
            this.pcpair.addDestructorCallback(this.destructor.bind(this));
        }

        // Drag action
        this.__dragHandle.actionManager = new BABYLON.ActionManager(this.scene);
        this.dragAction = new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger, 
            this.onDragStart.bind(this)
        )
        this.__dragHandle.actionManager.registerAction(this.dragAction);
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

    onDragStart() {
        LOG("Drag Started");
        // this.follower.disable();
        this.__dragData = {
            "dragEndAction": new BABYLON.ExecuteCodeAction(
                                BABYLON.ActionManager.OnPickTrigger, 
                                this.onDragEnd.bind(this)
                            ),
            "plane": BABYLON.MeshBuilder.CreatePlane("constructionPlane", {height:10, width:10}, this.scene)
        }

        // Create Plane for construction
        this.__dragData.plane.parent = null;
        this.__dragData.plane.position = new BABYLON.Vector3(
            this.__dragHandle.absolutePosition.x,
            this.__dragHandle.absolutePosition.y,
            this.__dragHandle.absolutePosition.z);
        this.__dragData.plane.lookAt(this.scene.activeCamera.position); // hides it very well
        this.__dragData.plane.material = new BABYLON.StandardMaterial("constructionMaterial", this.scene);
        this.__dragData.plane.material.alpha = 0; // hide it completely
        // this.__dragData.plane.material.backFaceCulling = false;

        // Create pointer drag and end click listeners
        this.__dragHandle.actionManager.unregisterAction(this.dragAction);
        this.__dragData["pointObservable"] = 
        this.scene.onPointerObservable.add(this.onDragUpdate.bind(this));
        // Register end drag on both the construction plane and on the mesh
        this.__dragHandle.actionManager.registerAction(this.__dragData.dragEndAction);
        this.__dragData.plane.actionManager = new BABYLON.ActionManager(this.scene);
        this.__dragData.plane.actionManager.registerAction(this.__dragData.dragEndAction);
    }
    
    onDragEnd() {
        LOG("Drag End");
        // this.mesh.parent = this.__dragData.startParent;

        // Unregister pointer tracker
        this.scene.onPointerObservable.remove(this.__dragData["pointObservable"]);

        // Unregister drag end listener
        this.__dragHandle.actionManager.unregisterAction(this.__dragData.dragEndAction);
        // Remove construction plane
        this.__dragData.plane.dispose();

        // Reregister drag
        this.__dragHandle.actionManager.registerAction(this.dragAction);
    }

    onDragUpdate(event) {
        if (event.pickInfo.pickedMesh && event.pickInfo.pickedMesh.name === "constructionPlane") {
            let pt = event.pickInfo.pickedPoint;
            let new_pos = new BABYLON.Vector3(
                pt.x - this.__dragHandle.position.x,
                pt.y - this.__dragHandle.position.y,
                pt.z - this.__dragHandle.position.z
            )
            this.mesh.position = new_pos;
            // console.log("Updated pose to", new_pos.asArray(), "and plane to", this.__dragData.plane);
        }
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