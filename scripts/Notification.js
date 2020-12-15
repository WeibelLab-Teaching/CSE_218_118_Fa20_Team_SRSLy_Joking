let alertManager;
let alertPanel;
let alertText;
let alertButton;

function alert(msg, babylon=true) {
    if (!babylon) {
        alert(msg);
    }
    else {
        // Setup Panel and Manager
        alertManager = new BABYLON.GUI.GUI3DManager(scene);
        alertPanel = new BABYLON.GUI.StackPanel3D();
        alertPanel.margin = 0.02;
        alertManager.addControl(alertPanel);

        // Position Panel
        let cam_pos = userCamera.position;
        let cam_dir = userCamera.getForwardRay().direction;

        alertPanel.position.x = cam_pos.x + cam_dir.x;
        alertPanel.position.y = cam_pos.y + cam_dir.y;
        alertPanel.position.z = cam_pos.z + cam_dir.z;
        alertPanel.node.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
        alertPanel.node.rotation = new BABYLON.Vector3(Math.PI / 3, 0, 0);

        // Add Button with text
        let alertButton = new BABYLON.GUI.HolographicButton("Alert Button");
        alertPanel.addControl(alertButton);
        let alertButtonText = new BABYLON.GUI.TextBlock();
        alertButtonText.text = msg;
        alertButtonText.color = "white";
        alertButtonText.fontSize = 10;
        alertButtonText.scaling = new BABYLON.Vector3(0.1/0.6, 1, 0.1/0.4);
        alertButton.content = alertButtonText;

        // Add Callback
        alertButton.onPointerUpObservable.add(() => {
            alertPanel.dispose();
            alertManager.dispose();
        });

    }
}