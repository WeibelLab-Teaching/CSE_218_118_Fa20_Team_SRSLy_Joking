
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
}