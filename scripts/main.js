var canvas = document.getElementById("renderCanvas");

var engine = undefined;
var scene = undefined;
var xr = undefined;
var xrHelper = undefined;
var p = undefined;
var userCamera;
var userLHand;
var userRHand;
var webRTCStreamer = undefined;

var playSpace;


var recordButton;

// TEMP: For debugging
var skeleton;
var mesh;
// setTimeout(() => {
// 	skeleton = ApplicationState.streamers[1].skeleton;
// 	mesh = ApplicationState.streamers[1].mesh;
// }, 2000);

/**
 * Add features to the ApplicationState variable as you desire
 * This will help us with saving and loading later.
 * So, if there is anything you might want saved, add and control it here.
 * These particular settings will be overriden by the server upon connecting.
 */
var ApplicationState = {
	following: false,
	streamers: [],
	play_area: [
		[1, 0, 1],
		[1, 0, -1],
		[-1, 0, -1],
		[-1, 0, 1]
	],
	environment: null,
	xr: false
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
	// xrHelper = await scene.createDefaultXRExperienceAsync();
	xrHelper = new BABYLON.VRExperienceHelper(scene);

	// Get User objects
	userCamera = scene.cameras.filter(c=>c.name==="deviceOrientationVRHelper")[0];
	userCamera.minZ = 0.5;
	console.log("User has", Object.keys(userCamera.inputs.attached), "input devices");
	userLHand = undefined;
	userRHand = undefined;

	// Control VR state
	// xrHelper.setLaserColor(new BABYLON.Color3(1, 0, 0));
	// xrHelper.setGazeColor(new BABYLON.Color3(0, 1, 0));
	// xrHelper.enableInteractions();
	
	xrHelper.onEnteringVR.add(() => {
		alert("In VR Now");
		// Look for controllers
		xrHelper.onControllerMeshLoadedObservable.add(() => {
			// Get controllers
			console.log("Got controllers");
			userLHand = xrHelper._leftController;
			userRHand = xrHelper._rightController;
		});

		// Set as xr user
		if ('avatarModel' in ApplicationState) {
			ApplicationState.xr = true;
			PCPair.announceIds();
			pushAppState();
		}
		chooseAvatar((uri) => {
			ApplicationState["avatarModel"] = uri;
			ApplicationState.xr = true;
			PCPair.announceIds();
			pushAppState();
		})

	})

	xrHelper.onAfterEnteringVRObservable.add(() => {
		// Set camera
		userCamera = scene.activeCamera; //scene.cameras.filter(c=>c.id==="VRDeviceOrientationVRHelper_L")[0];
		guiPanel.linkToTransformNode(userCamera);
		p.target = scene.activeCamera;
	})

	xrHelper.onExitingVR.add(() => {
		// Remove Controllers
		userLHand = undefined;
		userRHand = undefined;

		// Set as non-xr user
		ApplicationState.xr = false;
		PCPair.announceIds();
		pushAppState();


		// Set camera
		userCamera = scene.cameras.filter(c=>c.id==="deviceOrientationVRHelper")[0];
		guiPanel.linkToTransformNode(userCamera);
		p.target = scene.activeCamera;
	});

	// Set Ground Plane
	let ground = BABYLON.MeshBuilder.CreateGround("ground", {
		width: 40,
		height: 40,
		subdivisions: 4
	}, scene);

	playSpace = new PlaySpace(scene, ground);

	// BABYLON.VRExperienceHelper.addFloorMesh(ground)
	xrHelper.enableTeleportation({
		floorMeshName: "ground"
	});

	// Set Sun and Sky
	let light = new BABYLON.HemisphericLight("sun", new BABYLON.Vector3(0, 1, 0), scene);
	let skybox = BABYLON.Mesh.CreateBox("skybox", 1000, scene);
	let skymat = new BABYLON.SkyMaterial("skyboxMaterial", scene);
	skymat.backFaceCulling = false;
	skymat.turbidity = 12;
	skymat.luminance = .5;
	skymat.inclination = 0.2;
	skymat.azimuth = 0.29;
	skymat.rayleigh = 2;
	skymat.mieCoefficient = 0.005;
	skymat.mieDirectionalG = 0.9;

	// skymat.cameraOffset.y = userCamera.globalPosition.y;

	skybox.material = skymat
	
	// new BABYLON.CubeTexture("assets/skybox1/TropicalSunnyDay", scene);

	// Set UI Control panel
	var guiManager = new BABYLON.GUI.GUI3DManager(scene);
	var guiPanel = new BABYLON.GUI.StackPanel3D();
	guiPanel.margin = 0.02;
	guiManager.addControl(guiPanel);
	guiPanel.linkToTransformNode(userCamera);
	guiPanel.node.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
	guiPanel.position.z = 1;
	guiPanel.position.y = -0.25;
	guiPanel.node.rotation = new BABYLON.Vector3(Math.PI / 3, 0, 0);

	//// add buttons
	// follow / walking mode button
	let toggleFollowButton = new BABYLON.GUI.HolographicButton("Follow Button");
	guiPanel.addControl(toggleFollowButton);
	toggleFollowButton.onPointerUpObservable.add(onFollowClicked);
	// change environment button
	let toggleEnvironmentButton = new BABYLON.GUI.HolographicButton("Environment Button");
	guiPanel.addControl(toggleEnvironmentButton);
	toggleEnvironmentButton.onPointerUpObservable.add(Environment.onEnvironmentClicked);
	// play area button
	let playareaButton = new BABYLON.GUI.HolographicButton("Play Area Button");
	guiPanel.addControl(playareaButton);
	playareaButton.onPointerUpObservable.add(playSpace.enterPlaySpaceConfigurator.bind(playSpace));
	// connect to meeting button
	let joinButton = new BABYLON.GUI.HolographicButton("Join Button");
	guiPanel.addControl(joinButton);
	joinButton.onPointerUpObservable.add(onMeetingJoin);
	// Record button
	recordButton = new BABYLON.GUI.HolographicButton("Record");
	guiPanel.addControl(recordButton);
	recordButton.onPointerUpObservable.add(onRecordPressed);


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
	// play area
	let playareaText = new BABYLON.GUI.TextBlock();
	playareaText.text = "Set Play Space";
	playareaText.color = "white";
	playareaText.fontSize = 30;
	playareaButton.content = playareaText;
	// connect to meeting button
	let connectText = new BABYLON.GUI.TextBlock();
	connectText.text = "Toggle Audio/Video";
	connectText.color = "white";
	connectText.fontSize = 30;
	joinButton.content = connectText;
	// Record
	let recordText = new BABYLON.GUI.TextBlock();
	recordText.text = "Record";
	recordText.color="white";
	recordText.fontSize = 30;
	recordButton.content = recordText;

	if (callback) {
		callback(scene);
	}
};

window.onload = function () {


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
			if (scene && userCamera) {
				scene.render();
			}
		});

		// Handle Resize
		window.addEventListener("resize", function () {
			engine.resize();
		});



		// Setup Momentum Tracking
		p = new Momentum(userCamera);
		scene.onBeforeRenderObservable.add(function () {
			p.recordPose();
		})

		// Establish Websocket connection and load ApplicationState
		EstablishWebsocketConnection((conn) => {
			// Send user pose
			sendPose();
			// Connect to WebRTC
			joinRoom(ApplicationState.id, ApplicationState.room);
			// Load playspace
			playSpace.loadFromAppState();
		});
	});
}

function removeStreamer(uri_or_video_elm) {
	let target;

	// Find the video element if given a URL
	for (let streamer of ApplicationState.streamers) {
		if (typeof (uri_or_video_elm) === "string") {
			if (streamer.src.src === uri_or_video_elm) {
				target = streamer;
				break;
			}
		} else {
			if (streamer.src === uri_or_video_elm) {
				target = streamer;
				break;
			}
		}
	}

	console.log("Removing", target);

	// Remove from AppState
	ApplicationState.streamers.splice(ApplicationState.streamers.indexOf(target), 1);

	// Remove visuals
	target.destructor();
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
	} else {
		for (streamer of ApplicationState.streamers) {
			streamer.follower.disable();
		}
	}
}

/* Should join a meeting */
var producing = false;
function onMeetingJoin(roomid=123) {
	//TODO do something with roomid, for now it's just room #1.
	if (producing) {
		rc.closeProducer(RoomClient.mediaType.audio);
		rc.closeProducer(RoomClient.mediaType.video);
	}
	else {
		console.log("Join Meeting Room #" + roomid);
		rc.produce(RoomClient.mediaType.audio, audioSelect.value);
		rc.produce(RoomClient.mediaType.video, videoSelect.value);
	}
	producing = !producing;
}

var recording = false;
function onRecordPressed() {
	recording = !recording;
	console.log("Now Recording", recording);

	// Update text
	if (recording) {
		recordButton.content.text = "RECORDING";
		recordButton.plateMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0)
	}
	else {
		recordButton.content.text = "Record";
		recordButton.plateMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1)
	}

	// TODO: Implement acutal recording
}



function SetApplicationState(state) {
	// TODO: remove all of the old stuff


	ApplicationState = state;

	// Load Streamers
	for (let i in ApplicationState.streamers) {
		ApplicationState.streamers[i] = Streamer.deserialize(ApplicationState.streamers[i]);
	}

	// Load Environment
	Environment.setEnvironmentFromAppState(ApplicationState);
}