// play_area: [
//     [1, 0, 1],
//     [1, 0, -1],
//     [-1, 0, -1],
//     [-1, 0, 1]
// ],

class PlaySpace {
    // ==========	Instance Variables	==========
    __area;
    scene;
    ground;

    splines;
    splineVisuals;

    // Cursor
    cursor;
    clickAction;
    selecting;
    cursorUpdateObservable;
    

    // Controls
    doneButton;
    islandButton;
    boundaryButton;
    guiPanel;
    guiManager;

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

    constructor(scene, ground) {
        this.scene = scene;
        this.ground = ground;

	    if (!this.ground.actionManager) {
            this.ground.actionManager = new BABYLON.ActionManager(this.scene);
        } 

        this.__area = {
            "border": [],
            "islands": []
        };

        this.splines = [];
        this.splineVisuals = [];
    }

    cursorUpdate(event) {
        if (event.pickInfo.pickedMesh.id === this.ground.id) {
            this.__groundPlaneIntersectionPoint = event.pickInfo.pickedPoint
        }

        // Update cursor location
        if (this.cursor) {
            this.cursor.position = event.pickInfo.pickedPoint;
        }
    }

    addPoint() {
        this.area.border.push(this.__groundPlaneIntersectionPoint)
        console.log("Added point", this.__groundPlaneIntersectionPoint);
       
        if (this.area.border.length > 2) {
            this.showPlaySpace(false);
        }
        else {
            this.showPlaySpace(true);
        }
    }

    reset() {
        this.__area = {
            "border": [],
            "islands": []
        };
        this.splines = [];
        for (let vis of this.splineVisuals) {
            vis.dispose();
        }
        this.splineVisuals = [];
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
        let isles = []
        for (let island of this.area.islands) {
            isles.push(island.map(p=>[p.x, p.y, p.z]))
        }

        ApplicationState.play_area.border = this.area.border.map(p=>[p.x, p.y, p.z])
        ApplicationState.play_area.islands.push(isles);
        pushAppState();
    }

    /**
     * Single function call to display control panel
     * and show play area boundaries
     */
    enterPlaySpaceConfigurator() {
        // Remove Environment
        Environment.level();
        this.splines = [];
        for (let vis of this.splineVisuals) {
            vis.dispose();
        }
        this.splineVisuals = [];

        this.showPlaySpace();
        this.showControlPanel();
    }

    /**
     * Shows a visual of the play area.
     * Draws lines on the ground indicating the play area
     */
    showPlaySpace(closed=true) {
        // Clear old visuals
        for (let vis of this.splineVisuals) {
            vis.dispose();
        }

        // Create gradient material
        let material = new BABYLON.GradientMaterial("boundary material", scene);
        material.bottomColor = new BABYLON.Color3(0, .5, 1);
        material.topColor = new BABYLON.Color3(0, .5, 1);
        material.topColorAlpha = -2;
        material.bottomColorAlpha = 0.8;

        // Create path
        let shape = [
            new BABYLON.Vector3(0, 0.5, 0),
            new BABYLON.Vector3(0, 0.05, 0)
        ]
        let spline = BABYLON.Curve3.CreateCatmullRomSpline(this.area.border, 10, closed);
        let visual = BABYLON.MeshBuilder.ExtrudeShape("border visual", {
            shape: shape,
            path: spline.getPoints(),
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, scene);
        visual.material = material;
    
        // Add to instance variables
        this.splines.push(spline);
        this.splineVisuals.push(visual);
    }

    /**
     * Removes the playspace control panel
     */
    destroyControlPanel() {
        if (this.doneButton) {this.doneButton.dispose();}
        if (this.boundaryButton) {this.boundaryButton.dispose();}
        if (this.islandButton) {this.islandButton.dispose();}
        if (this.guiPanel) {this.guiPanel.dispose();}
        if (this.guiManager) {this.guiManager.dispose();}
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
        boundaryButton.onPointerUpObservable.add(this.drawBoundary.bind(this));
        let boundaryText = new BABYLON.GUI.TextBlock();
        boundaryText.text = "Draw Boundary";
        boundaryText.color = "white";
        boundaryText.fontSize = 30;
        boundaryButton.content = boundaryText;
        this.boundaryButton = boundaryButton;

        // Draw Islands
        let islandButton = new BABYLON.GUI.HolographicButton("Draw Islands");
        this.guiPanel.addControl(islandButton);
        islandButton.onPointerUpObservable.add(this.drawIslands.bind(this));
        let islandText = new BABYLON.GUI.TextBlock();
        islandText.text = "Draw Islands";
        islandText.color = "white";
        islandText.fontSize = 30;
        islandButton.content = islandText;
        this.islandButton = islandButton;

        // Done
        let doneButton = new BABYLON.GUI.HolographicButton("Done Button");
        this.guiPanel.addControl(doneButton);
        doneButton.onPointerUpObservable.add(this.saveAndExit.bind(this));
        let doneText = new BABYLON.GUI.TextBlock();
        doneText.text = "Done";
        doneText.color = "white";
        doneText.fontSize = 30;
        doneButton.content = doneText;
        this.doneButton = doneButton;
    }

    /**
     * Start drawing the room boundaries.
     * These are the corners of the walls in your environment
     */
    drawBoundary() {
        if (!this.selecting) {
            this.selecting = true;
            console.log("Drawing Bounds");
            this.reset(); // clear old data

            this.clickAction = new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger, 
                this.addPoint.bind(this)
            )

            this.ground.actionManager.registerAction(this.clickAction);
            this.cursor = BABYLON.Mesh.CreateTorus("PlaySpace Cursor", 0.75, 0.1, 20, this.scene);
            this.cursorUpdateObservable = 
                this.scene.onPointerObservable.add(this.cursorUpdate.bind(this));

            // Update control panel buttons
            this.boundaryButton.content.text = "Finish";
            this.islandButton.isVisible = false;
            this.doneButton.isVisible = false;
        }
        else {
            this.selecting = false;
            console.log("Ending Draw", this.area);
            this.showPlaySpace(true);
            if (this.clickAction) {
                this.ground.actionManager.unregisterAction(this.clickAction);
            }
            if (this.cursor) {this.cursor.dispose()}
            this.scene.onPointerObservable.remove(this.cursorUpdateObservable);

            // Update control panel buttons
            this.boundaryButton.content.text = "Draw Boundary";
            this.islandButton.isVisible = true;
            this.doneButton.isVisible = true;
        }
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
        this.updateAppState();
        this.destroyControlPanel();
        this.splines = [];
        for (let vis of this.splineVisuals) {
            vis.dispose();
        }

        Environment.setEnvironmentFromAppState(ApplicationState);
        console.log("Saving");
    }

    createVisualBoundary(meshes) {
        let ret = [];

        let spline = BABYLON.Curve3.CreateCatmullRomSpline(this.area.border, 3, true);

        let points = spline.getPoints();
        for (let i = 0; i < points.length; i++) {
            console.log("Placing rock at", points[i]);
            for (let j = 0; j < meshes.length; j++) {
                let instance = meshes[j].createInstance(`playareabound${i}_part${j}`);
                console.log("Scaling at", instance.scaling);
                let mult = 1 / instance.scaling.x;
                let trans = points[i].multiplyByFloats(mult, mult, mult);
                instance.locallyTranslate(trans);
                let scale = 3;
                instance.scaling = new BABYLON.Vector3(instance.scaling.x*scale, instance.scaling.y*scale, instance.scaling.z*scale);
                instance.rotation = new BABYLON.Vector3(0, math.random(-math.pi, math.pi), 0);
                ret.push(instance);
                // console.log("instantiated", instance);
            }
        }
        return ret;
    }


    /**
     * checks if a point is in the play area
     * Algorithm copied from https://github.com/substack/point-in-polygon/blob/master/index.js
     * @param {array} point the point to check as an array [x, y, z] eg: [1, 2, 3]
     */
    isInPlayArea(point) { // FIXME: this algorithm sucks

        let x = point[0];
        let y = point[2];


        let inside = false;
        for (let i=0, j=this.area.border.length-1;
            i < this.area.border.length;
            j = i++) {
            
            let xi = this.area.border[i][0];
            let yi = this.area.border[i][2];

            let xj = this.area.border[j][0];
            let yj = this.area.border[j][2];

            let intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }



        // for (let i = 0, j = this.area.border.length - 1; i < this.area.border.length; j = i++) {
        //     let xi = this.area.border[i][0];
        //     let zi = this.area.border[i][2];

        //     let xj = this.area.border[j][0];
        //     let zj = this.area.border[j][2];

        //     let intersect = ((zi > point[2]) != (zj > point[2])) &&
        //         (point[0] < (xj - xi) * (point[2] - zi) / (zj - zi) + xi);
        //     if (intersect) inside = !inside;
        // }

        return inside;
    }
}