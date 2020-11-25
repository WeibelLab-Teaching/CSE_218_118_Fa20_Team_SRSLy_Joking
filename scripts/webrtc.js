/* WebRTC/mediasoup code from https://github.com/Dirvann/mediasoup-sfu-webrtc-video-rooms to implement
 * webrtc features.
 */
var canvas = document.getElementById("renderCanvas");

var engine = undefined;
var scene = undefined;
var xr = undefined;
var xrHelper = undefined;
var treeMesh = undefined;
var p = undefined;

/**
 * Add features to the ApplicationState variable as you desire
 * This will help us with saving and loading later.
 * So, if there is anything you might want saved, add and control it here.
 */
var ApplicationState = {
	"following": false,
	"streamers": [],
	"play_area": [[1, 0, 1], [1, 0, -1], [-1, 0, -1], [-1, 0, 1]]
}

// webRTCStreamer: the stream of other peers
var webRTCStreamer = undefined;

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
	xrHelper = new BABYLON.VRExperienceHelper(scene)
	
	// Set cursor options
	if (true || 'no controllers exist / is phone VR') {
		
		xrHelper.setLaserColor(new BABYLON.Color3(1,0,0));
		xrHelper.setGazeColor(new BABYLON.Color3(0, 1, 0));
		xrHelper.enableInteractions()
	}

	// Set Ground Plane
	let ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 40, height: 40, subdivisions: 4}, scene);
	// BABYLON.VRExperienceHelper.addFloorMesh(ground)
	xrHelper.enableTeleportation({
		floorMeshName: "ground"
	});
	// give ambient light coming up from ground
	let ambientlight = new BABYLON.HemisphericLight("light0", new BABYLON.Vector3(0, 1, 0), scene);

	// Set Sun
	let light = new BABYLON.DirectionalLight("light1", new BABYLON.Vector3(0, -1, 0), scene);
	//light.intensity = 30;

	
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
	playButton.onPointerUpObservable.add(() => {for (let streamer of ApplicationState.streamers) {streamer.play()}});
	// connect to meeting button
	let joinButton = new BABYLON.GUI.HolographicButton("Join Button");
	guiPanel.addControl(joinButton);
	joinButton.onPointerUpObservable.add(onMeetingJoin);


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
	// connect to meeting button
	let connectText = new BABYLON.GUI.TextBlock();
	connectText.text = "Join Meeting";
	connectText.color = "white";
	connectText.fontSize = 30;
	joinButton.content = connectText;




	// // TEMP: Add a button for testing
	// var testPanel = new BABYLON.GUI.StackPanel3D();
	// testPanel.margin = 0.02;
	// guiManager.addControl(testPanel);
	// testPanel.node.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
	// testPanel.position.z = 1;
	// testPanel.position.y = 1;
	// testPanel.node.rotation = new BABYLON.Vector3(Math.PI/3, 0, 0);

	// let testButton = new BABYLON.GUI.HolographicButton("Test Button");
	// testPanel.addControl(testButton);
	// testButton.onPointerUpObservable.add(() => {
	// 	let advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
	// 	let text = new BABYLON.GUI.TextBlock();
	// 	text.text = "Clicked";
	// 	text.color = "black";
	// 	text.fontSize = 40;
	// 	advancedTexture.addControl(text);
	// 	setTimeout(() => {
	// 		advancedTexture.dispose()
	// 	}, 2000)
	// });

	// //// add text
	// // follow
	// let testButtonText = new BABYLON.GUI.TextBlock();
	// testButtonText.text = "Test Button";
	// testButtonText.color = "white";
	// testButtonText.fontSize = 30;
	// testButton.content = testButtonText;

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
		// Render Loop
		engine.runRenderLoop(function () {
			if (scene && scene.activeCamera) {
				scene.render();
			}
		});

		// Handle Resize
		window.addEventListener("resize", function () {
			engine.resize();
		});


		
		// Setup Momentum Tracking
		p = new Momentum(scene.activeCamera);
		scene.onBeforeRenderObservable.add(function() {
			p.recordPose();
		})

		// TEMP: Addd sample streamer
		addStreamer("assets/samplevid.mp4")
	});
}

/**
 * Adds a video stream to the scene
 * TODO: connect to WebRTC @eric
 * @param {string} uri the path to the video to stream (eg: assets/samplevid.mp4 or https://path.to.webrtc/uuid)
 */
function addStreamer(uri) {
	// Create <video> tag in html
	// TODO: hook up <video> tag to WebRTC
	// let streamsContainer = document.getElementById("streams");
	// let video = document.createElement("video");
	// video.setAttribute("src", uri);
	// streamsContainer.appendChild(video);

	// Add to app state
	let streamer = new Streamer(uri, scene);
	ApplicationState.streamers.push(streamer);

	// Set to follow
	if (ApplicationState.following) {
		streamer.follower.enable();
	}
}

/**
 * Toggles on and off the following behavior
 */
function onFollowClicked() {
	ApplicationState.following = !ApplicationState.following;

	if (ApplicationState.following) {
		for (streamer of ApplicationState.streamers) {
			streamer.follower.enable();
		}
	}
	else {
		for (streamer of ApplicationState.streamers) {
			streamer.follower.disable();
		}
	}
}

/**
 * Behavior to invoke when the environment button is clicked
 * TODO: show a series of options: AR, Forest, Office, etc.
 */
function onEnvironmentClicked() {
	console.log("Change Environment");

	// TEMP: randomly spawn trees
	spawnTrees();
}

/**
 * Spawns trees into the scene and sets the ground plane texture
 * To improve performance, 1 tree model is loaded, 
 * all other 'spawned' trees are instances of the first.
 * @param {int} numberToSpawn The number of trees to spawn
 */
function spawnTrees(numberToSpawn=15) {
	function spawn(numberToSpawn) {
		// spawn a bunch of trees
		let pos;

		for (let i=0; i<numberToSpawn; i++) {
			pos = new BABYLON.Vector3(Math.random()*4*numberToSpawn-2*numberToSpawn, 0, Math.random()*4*numberToSpawn-2*numberToSpawn);
			while (isInPlayArea(pos.asArray())) {
				console.log(`position (${pos.x}, ${pos.y}, ${pos.z}) is in play area`);
				pos = new BABYLON.Vector3(Math.random()*4*numberToSpawn-2*numberToSpawn, 0, Math.random()*4*numberToSpawn-2*numberToSpawn);
			}

			for (let j=0; j<treeMesh.length; j++) {
				let instance = treeMesh[j].createInstance(`Tree${i}_part${j}`);
				instance.locallyTranslate(pos);
			}
			//console.log(`Spawned Tree${i} at (${pos.x}, ${pos.y}, ${pos.z})`);
		}
	}


	if (!treeMesh) {
		BABYLON.SceneLoader.ImportMesh("", "/assets/", "Tree2.glb", scene, function(meshes) {
			console.log("Loaded at", meshes.map((m) => {return m.position}));

			treeMesh = meshes;
			let pos = new BABYLON.Vector3(Math.random()*4*numberToSpawn-2*numberToSpawn, 0, Math.random()*4*numberToSpawn-2*numberToSpawn);
			for (mesh of meshes) {
				mesh.locallyTranslate(pos);
			}
			spawn(numberToSpawn-1) // -1 because we just made one by importing the mesh
		});

		// Set Ground texture
		let groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
		groundMaterial.diffuseTexture = new BABYLON.Texture("/assets/ground/Color.jpg", scene);
		scene.getMeshesByID("ground")[0].material = groundMaterial;
	}
	else {
		spawn(numberToSpawn);
	}
}

/**
 * checks if a point is in the play area
 * Algorithm copied from https://github.com/substack/point-in-polygon/blob/master/index.js
 * @param {array} point the point to check as an array [x, y, z] eg: [1, 2, 3]
 */
function isInPlayArea(point) {

	let inside = false;
	for (let i=0, j=playArea.length-1; i<playArea.length; j = i++) {
		let xi = playArea[i][0];
		let zi = playArea[i][2];

		let xj = playArea[j][0];
		let zj = playArea[j][2];

		let intersect = ((zi > point[2]) != (zj > point[2])) && 
						(point[0] < (xj - xi) * (point[2]-zi) / (zj - zi) + xi);
		if (intersect) inside = !inside;
	}

	return inside;
}

/* Should join a meeting */
function onMeetingJoin(roomid=123) {
	//TODO do something with roomid, for now it's just room #1.
	console.log("Join Meeting Room #" + roomid);
	
}
