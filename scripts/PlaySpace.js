// play_area: [
//     [1, 0, 1],
//     [1, 0, -1],
//     [-1, 0, -1],
//     [-1, 0, 1]
// ],

class PlaySpace {
    // ==========	Instance Variables	==========

    get area() {
        return this.__area;
        this.__area = []
        for (point of ApplicationState.play_area) {
            this.__area.push(new BABYLON.Vector3(point[0], point[1], point[2]))
        }
        return this.__area
    }
    set area(value) {
        this.__area = value;
        return
        ApplicationState.play_area = value.map(v=>[v.x, v.y, v.z]); 
        pushAppState();
    }

    constructor() {
        this.__area = {
            "border": [],
            "islands": []
        };
        this.controlButtons = [];

        this.splines = [];
        this.splineVisuals = [];
    }

    addPoint(point) {
        
        this.area.push(point);
    }

    reset() {
        this.__area = {
            "border": [],
            "islands": []
        };
    }

    loadFromAppState() {
        this.reset();
        this.__area.border = ApplicationState.play_area.border.map(
            p=>new BABYLON.Vector3(p[0], p[1], p[2]))
        
        for (let island in ApplicationState.play_area.islands) {
            this.__area.islands.push(
                island.map(p=>new BABLYON.Vector3(p[0], p[1], p[2]))
            );
        }
    }

    /**
     * Updates the application state with the play area info
     * Also pushes the info to the server
     */
    updateAppState() {
        let a = {
            "border": [],
            "islands": []
        }

        a.border.push(this.area.border.map(p=>[p.x, p.y, p.z]))
        for (let island of this.area.islands) {
            a.islands.push(island.map(p=>[p.x, p.y, p.z]))
        }

        ApplicationState.play_area = a;
        pushAppState();
    }

    /**
     * Single function call to display control panel
     * and show play area boundaries
     */
    enterPlaySpaceConfigurator() {
        this.showPlaySpace();
        this.showControlPanel();
    }

    /**
     * Shows a visual of the play area.
     * Draws lines on the ground indicating the play area
     */
    showPlaySpace() {

        let material = new BABYLON.StandardMaterial("boundary material", scene);
        material.reflectionTexture = new BABYLON.CubeTexture("assets/skybox1/TropicalSunnyDay", scene);
        material.diffuseColor = new BABYLON.Color3(0, 0, 0);
        material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        material.alpha = 0.2;
        material.specularPower = 16;
        material.reflectionFresnelParameters = new BABYLON.FresnelParameters();
        material.reflectionFresnelParameters.bias = 0.1;
        material.emissiveFresnelParameters = new BABYLON.FresnelParameters();
        material.emissiveFresnelParameters.bias = 0.6;
        material.emissiveFresnelParameters.power = 4;
        material.emissiveFresnelParameters.leftColor = BABYLON.Color3.White();
        material.emissiveFresnelParameters.rightColor = BABYLON.Color3.Black();
        material.opacityFresnelParameters = new BABYLON.FresnelParameters();
        material.opacityFresnelParameters.leftColor = BABYLON.Color3.White();
        material.opacityFresnelParameters.rightColor = BABYLON.Color3.Black();


        let shape = [
            new BABYLON.Vector3(0.1, .25, 0),
            new BABYLON.Vector3(0, .5, 0),
            new BABYLON.Vector3(-0.1, 0.25, 0),
            new BABYLON.Vector3(0.1, 0.25, 0)
        ]
        let spline = BABYLON.Curve3.CreateCatmullRomSpline(this.area.border, 10, true);
        let visual = BABYLON.MeshBuilder.ExtrudeShape("border visual", {
            shape: shape,
            path: spline.getPoints(),
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, scene);
        visual.material = material;
    

        this.splines.push(spline);
        this.splineVisuals.push(visual);
    }

    /**
     * Removes the playspace control panel
     */
    destroyControlPanel() {
        for (let button of self.controlButtons) {
            button.content.dispose();
            button.dispose();
        }
        this.controlButtons = [];
        this.guiPanel.dispose();
        this.guiManager.dispose();
    }

    /**
     * Constructs the playspace control panel
     * buttons: draw boundaries, draw islands, done/save
     * 
     * (islands are like a chair in the middle of the room)
     */
    showControlPanel() {
        // TODO: Hide environment control panel
        // TODO: Disable main control panel

        // Set UI Control panel
        this.guiManager = new BABYLON.GUI.GUI3DManager(scene);
        this.guiPanel = new BABYLON.GUI.StackPanel3D();
        this.guiPanel.margin = 0.02;
        this.guiManager.addControl(this.guiPanel);
        this.guiPanel.linkToTransformNode(scene.activeCamera);
        this.guiPanel.node.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
        this.guiPanel.position = new BABYLON.Vector3(-0.09, -0.15, 1);
        this.guiPanel.node.rotation = new BABYLON.Vector3(Math.PI / 3, 0, 0);

        // Draw Walls
        let boundaryButton = new BABYLON.GUI.HolographicButton("Draw Boundary");
        this.guiPanel.addControl(boundaryButton);
        boundaryButton.onPointerUpObservable.add(this.drawBoundary);
        this.controlButtons.push(boundaryButton);
        let boundaryText = new BABYLON.GUI.TextBlock();
        boundaryText.text = "Draw Boundary";
        boundaryText.color = "white";
        boundaryText.fontSize = 30;
        boundaryButton.content = boundaryText;

        // Draw Islands
        let islandButton = new BABYLON.GUI.HolographicButton("Draw Islands");
        this.guiPanel.addControl(islandButton);
        islandButton.onPointerUpObservable.add(this.drawIslands);
        this.controlButtons.push(islandButton);
        let islandText = new BABYLON.GUI.TextBlock();
        islandText.text = "Draw Islands";
        islandText.color = "white";
        islandText.fontSize = 30;
        islandButton.content = islandText;

        // Done
        let doneButton = new BABYLON.GUI.HolographicButton("Done Button");
        this.guiPanel.addControl(doneButton);
        doneButton.onPointerUpObservable.add(this.saveAndExit);
        this.controlButtons.push(doneButton);
        let doneText = new BABYLON.GUI.TextBlock();
        doneText.text = "Done";
        doneText.color = "white";
        doneText.fontSize = 30;
        doneButton.content = doneText;



    }

    /**
     * Start drawing the room boundaries.
     * These are the corners of the walls in your environment
     */
    drawBoundary() {
        console.log("Drawing Bounds");
    }

    /**
     * Start drawing the room islands.
     * These are the random furniture/walls places in the middle of your room
     * These are like cutouts in the play area
     */
    drawIslands() {
        console.log("Drawing Islands");
    }

    /**
     * Saves the playspace and removes control panel and visuals.
     */
    saveAndExit() {
        console.log("Saving");
    }
}