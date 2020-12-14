class Environment {
    static grounds = {
        "beach": "/assets/BeachGround/Ground033_2K_Color.jpg",
        "forest": "/assets/ground/Color.jpg"
    }
    static assets = {
        "rock": ["/assets/", "rock.glb"],
        "tree": ["/assets/", "Tree2.glb"]
    }
    static parentMesh = undefined;
    static disposables = [];

    static guiManager;
    static guiPanel;
    static buttons = [];


    static dispose() {
        for (let disposable of Environment.disposables) {
            disposable.dispose();
        }
    }

    static setupEnvironment(ground, asset, allow_rotate=false, allow_scale=false, numberToSpawn=15) {
        console.log("Setting Environment to", ground, asset);
        function spawn(numberToSpawn) {
            let pos;
            let rot;
            let scale;

            for (let i = 0; i < numberToSpawn; i++) {
                pos = new BABYLON.Vector3(Math.random() * 4 * numberToSpawn - 2 * numberToSpawn, 0, Math.random() * 4 * numberToSpawn - 2 * numberToSpawn);
                while (isInPlayArea(pos.asArray())) {
                    pos = new BABYLON.Vector3(Math.random() * 4 * numberToSpawn - 2 * numberToSpawn, 0, Math.random() * 4 * numberToSpawn - 2 * numberToSpawn);
                }
                rot = new BABYLON.Vector3(Math.random() * 4 * numberToSpawn - 2 * numberToSpawn, Math.random(), Math.random() * 4 * numberToSpawn - 2 * numberToSpawn)
                scale = new BABYLON.Vector3(Math.random()+.2, Math.random()+.2, Math.random()+.2);

                for (let j = 0; j < Environment.parentMesh.length; j++) {
                    let instance = Environment.parentMesh[j].createInstance(`EnvironmentAsset${i}_part${j}`);
                    if (allow_scale) {
                        instance.scaling = scale;
                    }
                    instance.locallyTranslate(pos);
                    if (allow_rotate) {
                        instance.rotation = rot;
                    }
                    Environment.disposables.push(instance);
                }
            }
        }


        if (!Environment.parentMesh) {
            BABYLON.SceneLoader.ImportMesh(null, Environment.assets[asset][0], Environment.assets[asset][1], scene, function (meshes) {
                console.log(meshes);

                Environment.parentMesh = meshes.filter(mesh => {return mesh.name !== "__root__"});
                let pos = new BABYLON.Vector3(Math.random() * 4 * numberToSpawn - 2 * numberToSpawn, 0, Math.random() * 4 * numberToSpawn - 2 * numberToSpawn);
                for (let mesh of meshes) {
                    mesh.locallyTranslate(pos);
                    Environment.disposables.push(mesh);
                }
                console.log("Positioned environment asset at", pos);
                spawn(numberToSpawn - 1) // -1 because we just made one by importing the mesh
            });

            // Set Ground texture
            let groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
            groundMaterial.diffuseTexture = new BABYLON.Texture(Environment.grounds[ground], scene);
            scene.getMeshesByID("ground")[0].material = groundMaterial;
        } else {
            spawn(numberToSpawn);
        }
    }

    static RemoveButtons() {
        for (let button of Environment.buttons) {
            button.dispose();
        }
        Environment.buttons = [];
    }


    /**
     * Behavior to invoke when the environment button is clicked
     * TODO: show a series of options: AR, Forest, Office, etc.
     */
    static onEnvironmentClicked() {
        // Set UI Control panel
        Environment.guiManager = new BABYLON.GUI.GUI3DManager(scene);
        Environment.guiPanel = new BABYLON.GUI.StackPanel3D();
        Environment.guiPanel.margin = 0.02;
        Environment.guiManager.addControl(Environment.guiPanel);
        Environment.guiPanel.linkToTransformNode(scene.activeCamera);
        Environment.guiPanel.node.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
        Environment.guiPanel.position = new BABYLON.Vector3(-0.09, -0.15, 1);
        Environment.guiPanel.node.rotation = new BABYLON.Vector3(Math.PI / 3, 0, 0);

        // Beach
        let beachButton = new BABYLON.GUI.HolographicButton("Beach Button");
        Environment.guiPanel.addControl(beachButton);
        beachButton.onPointerUpObservable.add(function() {
            console.log("Setting to beach", Environment);
            Environment.setupEnvironment("beach", "rock", true, true);
            Environment.RemoveButtons();
        });
        Environment.buttons.push(beachButton);

        // Forest
        let forestButton = new BABYLON.GUI.HolographicButton("Forest Button");
        Environment.guiPanel.addControl(forestButton);
        forestButton.onPointerUpObservable.add(function() {
            console.log("Setting to forest", Environment);
            Environment.setupEnvironment("forest", "tree", false, false);
            Environment.RemoveButtons();
        });
        Environment.buttons.push(forestButton);

        // Beach Text
        let beachText = new BABYLON.GUI.TextBlock();
        beachText.text = "Beach";
        beachText.color = "white";
        beachText.fontSize = 30;
        beachButton.content = beachText;

        // Forest Text
        let forestText = new BABYLON.GUI.TextBlock();
        forestText.text = "Forest";
        forestText.color = "white";
        forestText.fontSize = 30;
        forestButton.content = forestText;

        console.log("Change Environment");
        Environment.dispose();

    }
}