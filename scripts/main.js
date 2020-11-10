var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var sceneToRender = null;
var streamer = null;
var inputController = null;

var createDefaultEngine = function () {
	return new BABYLON.Engine(canvas, true, {
		preserveDrawingBuffer: true,
		stencil: true
	});
};

async function createScene(callback) {
	// Setup scene
	var scene = new BABYLON.Scene(engine);
	var xr = await scene.createDefaultXRExperienceAsync();
	if (!xr.baseExperience) {
		console.warn("No XR Support");
	}
	else {
		console.log("Using XR");
	}
	// Setup Camera
	// var camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 1.5, new BABYLON.Vector3(0, 1.5, 0), scene);
	// camera.setTarget(BABYLON.Vector3.Zero());
	// camera.attachControl(canvas, true);

	// enable VR
	// var vrHelper = scene.createDefaultVRExperience();
	// vrHelper.onAfterEnteringVRObservable.add(() => {
	// 	if (scene.activeCamera === vrHelper.vrDeviceOrientationCamera) {
	// 	  BABYLON.FreeCameraDeviceOrientationInput.WaitForOrientationChangeAsync(1000)
	// 		.then(() => {
	// 		  // Successfully received sensor input
	// 		})
	// 		.catch(() => {
	// 		  alert(
	// 			"Device orientation camera is being used but no sensor is found, prompt user to enable in safari settings"
	// 		  );
	// 		});
	// 	}
	//   });

	

	// Set Lights
	var light = new BABYLON.PointLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
	light.intensity = 0.7;

	
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

	// add buttons
	let toggleFollowButton = new BABYLON.GUI.HolographicButton("Follow Button");
	guiPanel.addControl(toggleFollowButton);
	toggleFollowButton.onPointerUpObservable.add(onFollowClicked);

	// add text
	let toggleFollowText = new BABYLON.GUI.TextBlock();
	toggleFollowText.text = "Toggle Follow";
	toggleFollowText.color = "white";
	toggleFollowText.fontSize = 30;
	toggleFollowButton.content = toggleFollowText;

	// Get Controls
	// inputController = new InputController(vrHelper, "quest");
	// inputController.pressed.add(function() {
	// 	light = scene.lights[0];

	// 	console.log("Click event", light.diffuse);
	// 	if (light.diffuse.g === 1) {
	// 		console.log("Setting red");
	// 		light.diffuse = new BABYLON.Color3(1, 0, 0);
	// 	}
	// 	else {
	// 		console.log("Setting white");
	// 		light.diffuse = new BABYLON.Color3(1, 1, 1);
	// 	}
	// 	streamer.follower.toggle();
	// })

	if (callback) {
		callback(scene);
	}
};

window.onload = function() {

	var engine;
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

		
		streamer = new Streamer("assets/samplevid.mp4", scene);
	});
}

function onFollowClicked() {
	console.log("Follow clicked");
	streamer.follower.toggle();
}
