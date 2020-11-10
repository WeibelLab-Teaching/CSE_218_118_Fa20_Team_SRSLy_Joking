class Streamer {
    constructor(uri, scene, resolution=[1920, 1080]) {
        if (uri) {
            // Create a material from the video
            let mat = new BABYLON.StandardMaterial("mat", scene);
            this.texture = new BABYLON.VideoTexture("video", [uri], scene, true, false);
            mat.diffuseTexture = this.texture;

            this.mesh = BABYLON.Mesh.CreatePlane("videoPlane", 1, scene);
            this.mesh.scaling.x = resolution[0] / resolution[1]; // set aspect ratio
            this.mesh.material = mat;
            this.mesh.position = new BABYLON.Vector3(Math.random(-.5,.5), 2, Math.random(0.5,1));
        }

        else {
            BABYLON.Effect.ShadersStore["customVertexShader"] = "\r\n" +
                "precision highp float;\r\n" +

                "// Attributes\r\n" +
                "attribute vec3 position;\r\n" +
                "attribute vec2 uv;\r\n" +

                "// Uniforms\r\n" +
                "uniform mat4 worldViewProjection;\r\n" +

                "// Varying\r\n" +
                "varying vec2 vUV;\r\n" +

                "void main(void) {\r\n" +
                "    gl_Position = worldViewProjection * vec4(position, 1.0);\r\n" +

                "    vUV = uv;\r\n" +
                "}\r\n";

            BABYLON.Effect.ShadersStore["customFragmentShader"] = "\r\n" +
                "precision highp float;\r\n" +

                "varying vec2 vUV;\r\n" +

                "uniform sampler2D textureSampler;\r\n" +

                "void main(void) {\r\n" +
                "    gl_FragColor = texture2D(textureSampler, vUV);\r\n" +
                "}\r\n";

            var myVideo; // Our Webcam stream (a DOM <video>)
            var isAssigned = false; // Is the Webcam stream assigned to material?

            var plane1 = BABYLON.Mesh.CreatePlane("streamer1", 7, scene);
            plane1.rotation.z = Math.PI;
            plane1.position.y = 1;
            plane1.scaling.x = 1280 / 720; // set aspect ratio
            this.mesh = plane1;

            var shaderMaterial = new BABYLON.ShaderMaterial("shader", scene, {
                vertex: "custom",
                fragment: "custom",
            }, {
                attributes: ["position", "normal", "uv"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
            });
            shaderMaterial.backFaceCulling = false;

            // Create our video texture
            BABYLON.VideoTexture.CreateFromWebCam(scene, function (videoTexture) {
                myVideo = videoTexture;
                shaderMaterial.setTexture("textureSampler", myVideo);
            }, {
                maxWidth: 1280,
                maxHeight: 720
            });

            // When there is a video stream (!=undefined),
            // check if it's ready          (readyState == 4),
            // before applying shaderMaterial to avoid the Chrome console warning.
            // [.Offscreen-For-WebGL-0xa957edd000]RENDER WARNING: there is no texture bound to the unit 0
            scene.onBeforeRenderObservable.add(function () {
                if (myVideo !== undefined && isAssigned == false) {
                    if (myVideo.video.readyState == 4) {
                        plane1.material = shaderMaterial;
                        isAssigned = true;
                    }
                }
            });
        }
        
        this.mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;// | BABYLON.Mesh.BILLBOARDMODE_USE_POSITION;
        this.follower = new Follower(this.mesh, scene.activeCamera);
    }

    get position() {
        return this.mesh.absolutePosition;
    }

    get rotation() {
        return this.mesh.absoluteRotationQuaternion;
    }

    play() {
        this.texture.video.play();
    }
    pause() {
        this.texture.video.pause();
    }

    toggleFollow() {
        this.follower.toggle();
    }
}