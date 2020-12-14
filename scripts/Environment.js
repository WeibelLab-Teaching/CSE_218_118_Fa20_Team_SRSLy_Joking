class Environment {
    static grounds = {
        "beach": {
            "color": "/assets/BeachGround/Ground033_2K_Color.jpg",
            "normal": "/assets/BeachGround/Ground033_2K_Normal.jpg"
        },
        "forest": {
            "color": "/assets/ground/Color.jpg",
            "normal": "/assets/ground/Normal.jpg"
        },
        "wood": {
            "color": "/assets/WoodFloor/WoodFloor034_2K_Color.jpg",
            "normal": "/assets/WoodFloor/WoodFloor034_2K_Normal.jpg"
        }
    }
    static assets = {
        "rock": ["/assets/", "rock.glb"],
        "tree": ["/assets/", "Tree2.glb"]
    }
    static playAreaAssets = {
        // "bush": "/assets/Bush_Mediteranean/bush.glb",
        "rock": ["/assets/", "rock.glb"],
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

        this.parentMesh = null;
    }

    static setEnvironmentFromAppState(ApplicationState) {
        switch(ApplicationState.environment) {
            case "forest":
                Environment.setupEnvironment("forest", "tree", false, false, true);
                break;
            case "beach":
                Environment.setupEnvironment("beach", "rock", true, true);
                break;
            default:
                break;
        }
    }

    static setupEnvironment(ground, asset, allow_rotate=false, allow_scale=false, makeMountains=false, numberToSpawn=15) {
        console.log("Setting Environment to", ground, asset);
        this.level();

        BABYLON.SceneLoader.ImportMesh(null, Environment.assets[asset][0], Environment.assets[asset][1], scene, function (meshes) {
            console.log(meshes);
            let root = meshes.filter(mesh=>mesh.name==="__root__")
            if (root.length!==0){
                root = root[0];
            }
            else {
                root = undefined;
            }
            let pos = new BABYLON.Vector3(Math.random() * 4 * numberToSpawn - 2 * numberToSpawn, 0, Math.random() * 4 * numberToSpawn - 2 * numberToSpawn);
            Environment.parentMesh = meshes.filter(mesh => {return mesh.name !== "__root__"});;

            if (root.length!==0) {
                root.locallyTranslate(pos);
                Environment.disposables.push(root);
            }
            else {
                for (let mesh of meshes) {
                    mesh.locallyTranslate(pos);
                    Environment.disposables.push(mesh);
                }
            }
            console.log("Positioned environment asset at", pos);
            Environment.spawn(numberToSpawn - 1, allow_rotate, allow_scale) // -1 because we just made one by importing the mesh
        });

        // Set Ground texture
        let groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture(Environment.grounds[ground].color, scene);
        if ("normal" in Environment.grounds[ground]) {
            groundMaterial.bumpTexture = new BABYLON.Texture(Environment.grounds[ground].normal, scene);
        }
        groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

        let groundPlane = scene.getMeshByID("ground")

        if (makeMountains) {
            let mountains = Environment.formMountains();
            mountains.material = groundMaterial;
            groundMaterial.diffuseTexture.uScale = 5.0;
            groundMaterial.diffuseTexture.vScale = 5.0;
            Environment.disposables.push(mountains);

            // hide ground plane
            groundPlane.material = new BABYLON.StandardMaterial("invisible ground mat", scene);
            groundPlane.material.alpha = 0;
        }
        else {
            // groundPlane.material = groundMaterial;
            // groundPlane.material.alpha = 1;

            let giantPlane = new BABYLON.MeshBuilder.CreatePlane("giant plane", {size:200}, scene);
            giantPlane.rotation = new BABYLON.Vector3(math.pi/2, 0, 0);
            giantPlane.material = groundMaterial;
            groundMaterial.diffuseTexture.uScale = 5.0;
            groundMaterial.diffuseTexture.vScale = 5.0;
            Environment.disposables.push(giantPlane);

            // hide ground plane
            groundPlane.material = new BABYLON.StandardMaterial("invisible ground mat", scene);
            groundPlane.material.alpha = 0;
        }


        // Set play area visual
        Environment.setupPlayArea("rock");
    }

    static setupPlayArea(asset) {
        BABYLON.SceneLoader.ImportMesh(null, Environment.playAreaAssets[asset][0], Environment.playAreaAssets[asset][1], scene, function (meshes) {
            let placedMeshes = playSpace.createVisualBoundary(meshes.filter(mesh => {return mesh.name !== "__root__"}));
            for (let m of placedMeshes) {
                Environment.disposables.push(m);
            }

            for (let m of meshes) {
                Environment.disposables.push(m);
            }
        });
    }

    static spawn(numberToSpawn, allow_rotate=false, allow_scale=false) {
        if (!Environment.parentMesh) {
            throw new Error("Need a parent mesh before spawning");
            return;
        }
        let pos;
        let rot;
        let scale;

        for (let i = 0; i < numberToSpawn; i++) {
            pos = new BABYLON.Vector3(Math.random() * 4 * numberToSpawn - 2 * numberToSpawn, 0, Math.random() * 4 * numberToSpawn - 2 * numberToSpawn);
            while (playSpace.isInPlayArea(pos.asArray())) {
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

    static level() {
        Environment.dispose();

        // TODO: Level
        // mnts = scene.getMeshByName("Mountains")
        // if (mnts) {
        //     mnts.dispose();
        // }

        // Set Ground texture
        let groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture(Environment.grounds.wood.color, scene);
        groundMaterial.bumpTexture = new BABYLON.Texture(Environment.grounds.wood.normal, scene);
        groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        scene.getMeshByID("ground").material = groundMaterial;
    }

    static formMountains() {
        let mapSubX = 100;             // point number on X axis
        let mapSubZ = 100;              // point number on Z axis
        let seed = 0.3;                 // seed
        let noiseScale = 0.03;         // noise frequency
        let elevationScale = 6.0;
        noise.seed(seed);
        let mapData = new Float32Array(mapSubX * mapSubZ * 3); // 3 float values per point : x, y and z


        let sectionSizeZ = mapSubZ/5;
        let sectionSizeX = mapSubX/5;

        let paths = [];                             // array for the ribbon model
        for (let l = 0; l < mapSubZ; l++) {
            let path = [];                          // only for the ribbon
            for (let w = 0; w < mapSubX; w++) {
                let x = (w - mapSubX * 0.5) * 2.0;
                let z = (l - mapSubZ * 0.5) * 2.0;
                let y = noise.simplex2(x * noiseScale, z * noiseScale);
                y *= (0.5 + y) * y * elevationScale;   // let's increase a bit the noise computed altitude
                    
                // Flatten out play area;
                if (l > (mapSubZ/2-sectionSizeZ/2) && l < (mapSubZ/2+sectionSizeZ/2) &&
                    w > (mapSubX/2-sectionSizeX/2) && w < (mapSubX/2+sectionSizeX/2)) {
                    y = 0;
                }

                mapData[3 *(l * mapSubX + w)] = x;
                mapData[3 * (l * mapSubX + w) + 1] = y;
                mapData[3 * (l * mapSubX + w) + 2] = z;
                
                path.push(new BABYLON.Vector3(x, y, z));
            }
            paths.push(path);
        }


        let map = BABYLON.MeshBuilder.CreateRibbon("Mountains", {pathArray: paths, sideOrientation: 2}, scene);
        // map.position.y = -1.0;
        return map;
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
            console.log("Setting to beach");
            Environment.setupEnvironment("beach", "rock", true, true, false);
            Environment.RemoveButtons();
        });
        Environment.buttons.push(beachButton);

        // Forest
        let forestButton = new BABYLON.GUI.HolographicButton("Forest Button");
        Environment.guiPanel.addControl(forestButton);
        forestButton.onPointerUpObservable.add(function() {
            console.log("Setting to forest");
            Environment.setupEnvironment("forest", "tree", false, false, true);
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