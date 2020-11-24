class Streamer {
    constructor(video, scene, resolution=[1920, 1080], height=0.3) {
        this.name = "video" + ApplicationState.streamers.length;
        this.src = video;
        this.scene = scene;

        // Create a material from the video
        let material = new BABYLON.StandardMaterial(this.name+"Mat", scene);
        let texture = new BABYLON.VideoTexture(this.name, video, scene, true, false);
        material.diffuseTexture = texture;

        // Create Mesh
        this.mesh = BABYLON.Mesh.CreatePlane(this.name+"Plane", 1, scene);
        this.mesh.material = material;

        // Position Mesh
        let pos = new BABYLON.Vector3(Math.random(-.5,.5), 2, Math.random(0.5,1));
        this.mesh.scaling.y = height;
        this.mesh.scaling.x = this.mesh.scaling.y * resolution[0] / resolution[1]; // set aspect ratio
        this.mesh.position = pos;

        // Make sure it's always illuminated
        this.light = new BABYLON.PointLight(name+"PlaneLight", pos.add(new BABYLON.Vector3(0, 0, .2)), scene);
        this.light.parent = this.mesh;

        // Billboard
        this.scene.onBeforeRenderObservable.add(function() {
            this.mesh.lookAt(this.scene.activeCamera.position, Math.PI)
        }.bind(this));

        // Setup mesh for following
        this.follower = new Follower(this.mesh, scene.activeCamera);
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
}