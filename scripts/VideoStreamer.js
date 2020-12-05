/*
================================================================================
        Video Streamer
================================================================================
Child of the Streamer class
Makes a streamer that streams vid
*/

class Streamer extends Streamer {
        constructor(scene, momentum, pair, position=undefined, height = 0.3, resolution=[1920,1080]) {
                super(scene, momentum, pair, position);
                this.xr = false;

                // Create a material from the video
                let material = new BABYLON.StandardMaterial(this.name + "Mat", scene);
                let texture = new BABYLON.VideoTexture(this.name, video, scene, true, false);
                material.diffuseTexture = texture;

                // Create Mesh
                let video = BABYLON.Mesh.CreatePlane(this.name + "Plane", 1, scene);
                video.material = material;

                // Scale to appropriate size
                video.scaling.y = height;
                video.scaling.x = this.mesh.scaling.y * resolution[0] / resolution[1]; // set aspect ratio

                // Set video as child of transform node
                video.setParent(this.mesh);
                video.setPositionWithLocalVector(BABYLON.Vector3(0, 0, 0));
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