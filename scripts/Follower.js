/**
 * Class for making on object follow another
 */
class Follower {
    constructor(mesh, target, scene) {
        this.mesh = mesh;
        this.target = target;
        this.scene = scene;
        this.isFollowing = false;
        this.isBillboarding = 0;
        this.initialOffset = null;
        this.referenceNode = null;
    }

    destructor() {
        if (this.referenceNode) {
            this.referenceNode.dispose();
        }
        this.disable();
    }

    /**
     * Private function which causes the screen to follow the user
     */
    follow() {
        // Get relative position
        let targetPose;
        if (this.target instanceof Momentum) {
            targetPose = new Pose(this.target.pose).T;
        } else if (this.target instanceof BABYLON.Node) {
            targetPose = new Pose(this.target.position.asArray(), this.target.rotation.asArray()).T;
        }

        let newPose = math.multiply(targetPose, this.initialOffset)
        let pos = math.squeeze(newPose.subset(math.index(math.range(0, 3), 3))).toArray();

        this.mesh.position.x = pos[0];
        this.mesh.position.y = pos[1];
        this.mesh.position.z = pos[2];
    }

    billboard(enable=true, strategy=1) {
        // Remove old billboarding logic=
        switch (this.isBillboarding) {
            case 0:
                break;
            case 1:
                this.scene.onBeforeRenderObservable.remove(this._billboard_logic.bind(this));
                break;
            case 2:
                this.scene.onBeforeRenderObservable.remove(this._face_logic.bind(this));
                break;
            default:
                console.error("Unknown billboarding type", this.isBillboarding);
                enable = false;
                break;
        }


        if (enable) {
            switch (strategy) {
                case 1:
                    this.scene.onBeforeRenderObservable.add(this._billboard_logic.bind(this));
                    this.isBillboarding = 1
                    break;
                case 2:
                    this.scene.onBeforeRenderObservable.add(this._face_logic.bind(this));
                    this.isBillboarding = 2
                    break;
                default:
                    console.error("Unknown billboarding strategy", strategy);
                    break;
            }
        }
        else {
            this.isBillboarding = 0
        }
    }

    _billboard_logic() {
        this.mesh.lookAt(this.scene.activeCamera.position, Math.PI)
    }

    _face_logic() {
        let targetPosition = (new Pose(this.target.pose)).position

        let theta = math.atan2(
            targetPosition[0] - this.mesh.position.x,
            targetPosition[2] - this.mesh.position.z
        )
        this.mesh.rotation.y = theta;
    }

    /**
     * Sets the distance the object will be away from the target
     * in the case of the streamers and the camera this will be
     * where the streamer stays relative to the camera
     */
    setOffset() {
        // Target Pose is c_in_w
        let targetPose;
        if (this.target instanceof Momentum) {
            targetPose = new Pose(this.target.pose);
        } else if (this.target instanceof BABYLON.Node) {
            targetPose = new Pose(this.target.position.asArray(), this.target.rotation.asArray());
        }

        // objectPose is v_in_w
        let objectPose = new Pose(this.mesh.position.asArray(), this.mesh.rotation.asArray());
        // inverse of target pose
        console.log("Camera pose", targetPose, "\nVideo Pose", objectPose);
        let w_in_c = math.inv(targetPose.T);

        this.initialOffset = math.multiply(w_in_c, objectPose.T);

    }

    /**
     * Turns on and off the following behavior
     * @param {boolean} updateOffset whether or not to update the fixed distance from the camera
     */
    toggle(updateOffset = false) {
        if (!this.initialOffset || updateOffset) {
            this.setOffset();
        }

        if (this.isFollowing) {
            this.mesh._scene.unregisterBeforeRender(this._followingCallback);
            this.isFollowing = false;
            this._followingCallback = null;
        } else {
            this._followingCallback = this.follow.bind(this);
            this.mesh._scene.registerBeforeRender(this._followingCallback);
            this.isFollowing = true;
        }
    }

    /**
     * Turns on the following behavior
     * @param {boolean} updateOffset force update the fixed distance from the camera?
     */
    enable(updateOffset = false) {
        // Set offset if needed
        if (!this.initialOffset || updateOffset) {
            this.setOffset();
        }

        if (this.isFollowing) {
            return;
        } else {
            this._followingCallback = this.follow.bind(this);
            this.mesh._scene.registerBeforeRender(this._followingCallback);
            this.isFollowing = true;
        }
    }

    /**
     * Turns off the following behavior
     */
    disable() {
        if (this.isFollowing) {
            this.mesh._scene.unregisterBeforeRender(this._followingCallback);
            this.isFollowing = false;
            this._followingCallback = null;
        } else {
            return;
        }
    }
}