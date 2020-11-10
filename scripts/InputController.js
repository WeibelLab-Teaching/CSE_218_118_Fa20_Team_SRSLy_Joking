class InputController {
    constructor(vrHelper, type="quest") {
        this.click = new BABYLON.Observable();
        this.press = new BABYLON.Observable();
        this.changeSelection = new BABYLON.Observable();


        if (type === "quest") {

            vrHelper.onControllerMeshLoaded.add((webVRController)=>{
                //left:Y, right:B
                webVRController.onSecondaryButtonStateChangedObservable.add((stateObject)=>{
                    if (stateObject.pressed === true) {
                        this.press.notifyObservers();
                    }

                    // if (stateObject.changed.pressed === false) {
                    //     this.click.notifyObservers();
                    // }
                });
                //left:X, right:A
                webVRController.onMainButtonStateChangedObservable.add((stateObject)=>{
                    if(stateObject.pressed === true){
                        this.press.notifyObservers();             
                    } 

                    // if (stateObject.changed.pressed === false) {
                    //     this.click.notifyObservers();
                    // }
                });
                
                //Trigger button
                webVRController.onTriggerStateChangedObservable.add((stateObject)=>{
                    if (stateObject.value > 0) {
                        this.press.notifyObservers();
                    }
                });
                
                //secondary trigger button
                var leftLastSecondaryTriggerValue,rightLastSecondaryTriggerValue;
                webVRController.onSecondaryTriggerStateChangedObservable.add((stateObject)=>{
                    if (stateObject.value > 0) {
                        this.press.notifyObservers();
                    }
                });

                //stick
                webVRController.onPadValuesChangedObservable.add((stateObject)=>{
                    this.changeSelection.notifyObservers(stateObject.x / Math.abs(stateObject.x));
                });
            });


        }
    }
}