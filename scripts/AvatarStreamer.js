
class AvatarStreamer extends Streamer {
    constructor(scene, momentum, pair, position=undefined, avatarUri="") {
        super(scene, momentum, pair, position);

        this.xr = true;

        this.avatar = avatarUri.split(/(?<=\/)(?!.*\/.*.(glb|babylon|gltf))/).filter(sec => sec !== undefined);
        console.log("Attempting to import mesh", this.avatar);

        // Import as Mesh
        BABYLON.SceneLoader.ImportMesh(null, this.avatar[0], this.avatar[1], scene, function (meshes, particleSystems, skeletons) {
            console.log("[Streamer][AvatarStreamer] Loaded Avatar", meshes.map(m => {
                return m.name
            }));
            let model = meshes[0];
            model.setParent(this.mesh);
            this.skeleton = skeletons[0];

            // Add to list of disposable elements
            this._disposables = this._disposables.concat(meshes.concat(skeletons));

            // Scale waaaay down
            model.scaling = new BABYLON.Vector3(0.03, 0.03, 0.03);
            scene.beginAnimation(this.skeleton, 0, 100, 1, true);
        }.bind(this));

        // Import as scene
        // BABYLON.SceneLoader.Append(avatarUri, "", scene, function(newScene) {
        //     console.log("Loaded Avatar as scene", newScene);
        //     this.mesh = newScene;
        // }.bind(this));
    }

    serialize() {
        let ret = super.serialize();
        ret.type = "AvatarStreamer",
        ret["avatarUri"] = this.avatar.join("");
    }

    static deserialize(scene, momentum, serial) {
        let pair = PCPair.deserialize(serial.pair);
        let transformationMatrix = BABYLON.Matrix.FromValues(
            serial.transform[0], serial.transform[1], serial.transform[2], serial.transform[3], 
            serial.transform[4], serial.transform[5], serial.transform[6], serial.transform[7], 
            serial.transform[8], serial.transform[9], serial.transform[10], serial.transform[11], 
            serial.transform[12], serial.transform[13], serial.transform[14], serial.transform[15]);


        let streamer = new AvatarStreamer(scene, momentum, pair, transformationMatrix.getTranslation(), serial.avatarUri);

        // Set to follow
        if (ApplicationState.following) {
            streamer.follower.enable();
        }

        return streamer;
    }

    get model() {
        return this.mesh.getDescendants()[0];
    }

    setAvatarPose(msg) {

        let head_world = msg.world.head? BABYLON.Matrix.FromArray(msg.world.head): null;
        let lhand_world = msg.world.lhand? BABYLON.Matrix.FromArray(msg.world.lhand): null;
        let rhand_world = msg.world.rhand? BABYLON.Matrix.FromArray(msg.world.rhand): null;

        let head_relative = msg.relative.head? BABYLON.Matrix.FromArray(msg.relative.head): null;
        let lhand_relative = msg.relative.lhand? BABYLON.Matrix.FromArray(msg.relative.lhand): null;
        let rhand_relative = msg.relative.rhand? BABYLON.Matrix.FromArray(msg.relative.rhand): null;

        // TODO: Choose which elements to use for position and rotation

        // Set head position
        this.position = head_relative.getTranslation();

        // Quaternions
        let rot = BABYLON.Quaternion.FromRotationMatrix(head_world.getRotationMatrix());
        this.mesh.rotation = rot.toEulerAngles();

        // check - https://doc.babylonjs.com/divingDeeper/mesh/bonesSkeletons
        // var target = BABYLON.MeshBuilder.createSphere();
        // var lookCtrl = new BABYLON.BoneLookController(characterMesh, headBone, target.position, { adjustYaw: Math.PI * 0.5, adjustPitch: Math.PI * 0.5, adjustRoll: Math.PI });
        // scene.registerBeforeRender(function () {
        //     lookCtrl.update();
        // });
    }
}