var canvas = document.getElementById("renderCanvas");

var engine = undefined;
var scene = undefined;
var xr = undefined;
var streamer = undefined;

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

		// TODO: Insert code to create streamers and connect to server
		streamer = new Streamer("assets/samplevid.mp4", scene); // TEMP: play a video for now
	});
}

function onFollowClicked() {
	console.log("Follow clicked");
	streamer.follower.toggle();
}
