var canvas = document.getElementById("renderCanvas");

var engine = undefined;
var scene = undefined;
var xr = undefined;
var streamer = undefined;
var treeMesh = undefined;

var createDefaultEngine = function () {
	return new BABYLON.Engine(canvas, true, {
		preserveDrawingBuffer: true,
		stencil: true
	});
};

async function createScene(callback) {
	// Setup scene
	scene = new BABYLON.Scene(engine);
	xr = await scene.createDefaultXRExperienceAsync();

	// Set Ground Plane
	let ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 40, height: 40, subdivisions: 4}, scene);
	// ground.translate(new BABYLON.Vector3(-20, 0, -20))

	// Set Lights
	let light = new BABYLON.PointLight("light1", new BABYLON.Vector3(0, 10, 0), scene);
	light.intensity = 30;

	
	// Set UI Control panel
	var guiManager = new BABYLON.GUI.GUI3DManager(scene);
	var guiPanel = new BABYLON.GUI.StackPanel3D();
	guiPanel.margin = 0.02;
	guiManager.addControl(guiPanel);
	guiPanel.linkToTransformNode(scene.activeCamera);
	guiPanel.node.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
	guiPanel.position.z = 1;
	guiPanel.position.y = -0.25;
	guiPanel.node.rotation = new BABYLON.Vector3(Math.PI/3, 0, 0);

	//// add buttons
	// follow / walking mode button
	let toggleFollowButton = new BABYLON.GUI.HolographicButton("Follow Button");
	guiPanel.addControl(toggleFollowButton);
	toggleFollowButton.onPointerUpObservable.add(onFollowClicked);
	// change environment button
	let toggleEnvironmentButton = new BABYLON.GUI.HolographicButton("Environment Button");
	guiPanel.addControl(toggleEnvironmentButton);
	toggleEnvironmentButton.onPointerUpObservable.add(onEnvironmentClicked);
	// play button
	let playButton = new BABYLON.GUI.HolographicButton("Play Button");
	guiPanel.addControl(playButton);
	playButton.onPointerUpObservable.add(() => {streamer.play()});

	//// add text
	// follow
	let toggleFollowText = new BABYLON.GUI.TextBlock();
	toggleFollowText.text = "Toggle Follow";
	toggleFollowText.color = "white";
	toggleFollowText.fontSize = 30;
	toggleFollowButton.content = toggleFollowText;
	// environment
	let envText = new BABYLON.GUI.TextBlock();
	envText.text = "Change Environment";
	envText.color = "white";
	envText.fontSize = 30;
	toggleEnvironmentButton.content = envText;
	// play
	let playText = new BABYLON.GUI.TextBlock();
	playText.text = "Play Debug";
	playText.color = "white";
	playText.fontSize = 30;
	playButton.content = playText;

	if (callback) {
		callback(scene);
	}
};

window.onload = function() {

	
	try {
		engine = createDefaultEngine();
	} catch (e) {
		console.log("the available createEngine function failed. Creating the default engine instead");
		engine = createDefaultEngine();
	}
	if (!engine) throw 'engine should not be null.';
	createScene((scene) => {
		engine.runRenderLoop(function () {
			if (scene && scene.activeCamera) {
				scene.render();
			}
		});

		// Resize
		window.addEventListener("resize", function () {
			engine.resize();
		});

		// TODO: Insert code to create streamers and connect to server
		streamer = new Streamer("assets/samplevid.mp4", scene); // TEMP: play a video for now
	});
}

function onFollowClicked() {
	console.log("Follow clicked");
	streamer.follower.toggle();
}

function onEnvironmentClicked() {
	console.log("Change Environment");

	// TEMP: randomly spawn trees
	spawnTrees();
	
}

function spawnTrees(numberToSpawn=5) {
	BABYLON.SceneLoader.ImportMesh("", "/assets/", "Tree1.glb", scene, function(meshes) {
		console.log("Loaded at", meshes.map((m) => {return m.position}));

		treeMesh = meshes;
		let pos = new BABYLON.Vector3(Math.random()*4*numberToSpawn-2*numberToSpawn, 0, Math.random()*4*numberToSpawn-2*numberToSpawn);
		for (mesh of meshes) {
			mesh.locallyTranslate(pos);
		}
		
		// spawn a bunch of trees
		for (let i=1; i<numberToSpawn; i++) {
			pos = new BABYLON.Vector3(Math.random()*4*numberToSpawn-2*numberToSpawn, 0, Math.random()*4*numberToSpawn-2*numberToSpawn);

			for (let j=0; j<meshes.length; j++) {
				let instance = meshes[j].createInstance(`Tree${i}_part${j}`);
				instance.locallyTranslate(pos);
			}
			console.log(`Spawned Tree${i} at (${pos.x}, ${pos.y}, ${pos.z})`);
		}
	})
}
