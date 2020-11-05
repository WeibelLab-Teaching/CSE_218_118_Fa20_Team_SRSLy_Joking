var canvas = document.getElementById("renderCanvas");

var engine = null;
var scene = null;
var sceneToRender = null;
var streamer = null;

var createDefaultEngine = function () {
	return new BABYLON.Engine(canvas, true, {
		preserveDrawingBuffer: true,
		stencil: true
	});
};

var createScene = function () {
	// Setup scene
	var scene = new BABYLON.Scene(engine);
	
	var camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 3, new BABYLON.Vector3(0, 3, 0), scene);
	// var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
	camera.setTarget(BABYLON.Vector3.Zero());
	camera.attachControl(canvas, true);
	var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
	light.intensity = 0.7;

	streamer = new Streamer("assets/samplevid.mp4", scene);

	// enable VR
	var vrHelper = scene.createDefaultVRExperience();
	vrHelper.onAfterEnteringVRObservable.add(() => {
		if (scene.activeCamera === vrHelper.vrDeviceOrientationCamera) {
		  BABYLON.FreeCameraDeviceOrientationInput.WaitForOrientationChangeAsync(1000)
			.then(() => {
			  // Successfully received sensor input
			})
			.catch(() => {
			  alert(
				"Device orientation camera is being used but no sensor is found, prompt user to enable in safari settings"
			  );
			});
		}
	  });

	return scene;
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
	scene = createScene();;
	sceneToRender = scene
	
	engine.runRenderLoop(function () {
		if (sceneToRender && sceneToRender.activeCamera) {
			sceneToRender.render();
		}
	});
	
	// Resize
	window.addEventListener("resize", function () {
		engine.resize();
	});
}