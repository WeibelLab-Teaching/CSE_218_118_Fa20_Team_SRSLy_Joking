/*
================================================================================
        Video Streamer
================================================================================
Child of the Streamer class
Makes a streamer that streams vid
*/

class VideoStreamer extends Streamer {
        constructor(scene, momentum, pair, position=undefined, height = 1, resolution=[1920,1080]) {
                super(scene, momentum, pair, position);
                this.xr = false;
                this.height = height;
                this.resolution = resolution;

                // Create Mesh
                let video = BABYLON.Mesh.CreatePlane(this.name + "Plane", 1, scene);
                video.parent = this.mesh;
                this._disposables.push(video);
                // video.setPositionWithLocalVector(BABYLON.Vector3(0, 0, 0));

                // Scale to appropriate size
                video.scaling.y = height;
                video.scaling.x = height * resolution[0] / resolution[1]; // set aspect ratio

                // Create a material from the video
                let material = new BABYLON.StandardMaterial(this.name + "Mat", scene);
                let texture = new BABYLON.VideoTexture(this.name, "/assets/samplevid.mp4", scene, true, false);
                material.diffuseTexture = texture;
                video.material = material;
        }

        serialize() {
                let ret = super.serialize();
                ret.type = "VideoStreamer";
                ret["height"] = this.height;
                ret["resolution"] = this.resolution;
                return ret;
        }

        static deserialize(scene, momentum, serial) {
                let pair = PCPair.deserialize(serial.pair);
                let transformationMatrix = BABYLON.Matrix.FromValues(
                    serial.transform[0], serial.transform[1], serial.transform[2], serial.transform[3], 
                    serial.transform[4], serial.transform[5], serial.transform[6], serial.transform[7], 
                    serial.transform[8], serial.transform[9], serial.transform[10], serial.transform[11], 
                    serial.transform[12], serial.transform[13], serial.transform[14], serial.transform[15]);
        
                let streamer = new VideoStreamer(scene, momentum, pair, transformationMatrix.getTranslation(), serial.height, serial.resolution);
        
                // Set to follow
                if (ApplicationState.following) {
                    streamer.follower.enable();
                }
        
                return streamer;
        }

        updateVideo() {
                let material = new BABYLON.StandardMaterial(this.name + "Mat", scene);
                let texture = new BABYLON.VideoTexture(this.name, "/assets/samplevid.mp4", scene, true, false);
                material.diffuseTexture = texture;
                video.material = material;
        }

        play() {
                this.src.play();
        }
        pause() {
                this.src.pause();
        }

        get videoMesh() {
                return this.mesh.getDescendants()[0];
        }
}