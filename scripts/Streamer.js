class Streamer {
    constructor(video, scene, resolution = [1920, 1080], height = 0.3, position=null, avatarUri=null) {
        this.name = "video" + ApplicationState.streamers.length;
        this.src = video;
        this.scene = scene;
        this.xr = avatarUri? true: false;


        // Calculate Mesh position if needed (will set position after loading mesh - the light source needs this variable)
        if (position) {
            this.mesh.position = position;
        }
        else {
            position = new BABYLON.Vector3(Math.random(-.5, .5), 2, Math.random(0.5, 1));
        }

        if (this.xr) {
            this.avatar = avatarUri.split(/(?<=\/)(?!.*\/.*.(glb|babylon|gltf))/).filter(sec=>sec!==undefined);
            console.log("Attempting to import mesh", this.avatar);

            // Import as Mesh
            BABYLON.SceneLoader.ImportMesh(null, this.avatar[0], this.avatar[1], scene, function (meshes, particleSystems, skeletons) {
                console.log("Loaded Avatar", meshes.map(m => {return m.name}));
                this.mesh = meshes[0];
                this.skeleton = skeletons[0];

                // Scale waaaay down
                this.mesh.scaling = new BABYLON.Vector3(0.03, 0.03, 0.03);
                scene.beginAnimation(this.skeleton, 0, 100, 1, true);
            }.bind(this));

            // Import as scene
            // BABYLON.SceneLoader.Append(avatarUri, "", scene, function(newScene) {
            //     console.log("Loaded Avatar as scene", newScene);
            //     this.mesh = newScene;
            // }.bind(this));
        }
        else {
            // Create a material from the video
            let material = new BABYLON.StandardMaterial(this.name + "Mat", scene);
            let texture = new BABYLON.VideoTexture(this.name, video, scene, true, false);
            material.diffuseTexture = texture;

            // Create Mesh
            this.mesh = BABYLON.Mesh.CreatePlane(this.name + "Plane", 1, scene);
            this.mesh.material = material;

            // Scale to appropriate size
            this.mesh.scaling.y = height;
            this.mesh.scaling.x = this.mesh.scaling.y * resolution[0] / resolution[1]; // set aspect ratio

            // Place loaded mesh
            this.mesh.position = position;
    
            // Setup mesh for following
            this.follower = new Follower(this.mesh, p, scene);
            this.follower.billboard(true);
        }

    }

    destructor() {
        // Remove mesh from Scene
        this.mesh.dispose();
        this.light.dispose();

        // Remove video elm from DOM
        document.getElementById("streams").removeChild(this.src)

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

    play() {
        this.src.play();
    }
    pause() {
        this.src.pause();
    }

    toggleFollow() {
        this.follower.toggle();
    }

    setAvatarPose(pose) {
        let samplePose = {
            head: [],
            lhand: [],
            rhand: []
        }

        // check - https://doc.babylonjs.com/divingDeeper/mesh/bonesSkeletons
        // var target = BABYLON.MeshBuilder.createSphere();
        // var lookCtrl = new BABYLON.BoneLookController(characterMesh, headBone, target.position, { adjustYaw: Math.PI * 0.5, adjustPitch: Math.PI * 0.5, adjustRoll: Math.PI });
        // scene.registerBeforeRender(function () {
        //     lookCtrl.update();
        // });
    }
}