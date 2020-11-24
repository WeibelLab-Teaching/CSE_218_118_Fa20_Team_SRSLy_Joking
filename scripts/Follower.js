/**
 * Class for making on object follow another
 */
class Follower {
    constructor(mesh, target) {
        this.mesh = mesh;
        this.target = target;
        this.scene = mesh.scene;
        this.isFollowing = false;
        this.initialOffset = null;
        this.referenceNode = null;
    }

    follow() {
        // Get relative position
        let targetPose;
        if (this.target instanceof Momentum) {
            targetPose = this.target.pose;
        }
        else if (this.target instanceof BABYLON.Node) {
            targetPose = new Pose(this.target.position.asArray(), this.target.rotation.asArray()).T;
        }

        let newPose = math.multiply(targetPose, this.initialOffset)
        let pos = math.squeeze(newPose.subset(math.index(math.range(0, 3), 3))).toArray();

        this.mesh.position.x = pos[0];
        // this.mesh.position.y = pos[1];
        this.mesh.position.z = pos[2];
        // this.mesh.position = BABYLON.Vector3(pos[0], pos[1], pos[2]);

        // TODO: add smoothing


    }

    setOffset() {
        if (this.target instanceof Momentum) {
            this.initialOffset = this.target.pose;
        }
        else if (this.target instanceof BABYLON.Node) {
            // Target Pose is c_in_w
            let targetPose = new Pose(this.target.position.asArray(), this.target.rotation.asArray());
            // objectPose is v_in_w
            let objectPose = new Pose(this.mesh.position.asArray(), this.mesh.rotation.asArray());
            // inverse of target pose
            console.log("Camera pose", targetPose, "\nVideo Pose", objectPose);
            let w_in_c = math.inv(targetPose.T);
    
            this.initialOffset = math.multiply(w_in_c, objectPose.T);
        }
    }

    toggle(updateOffset=false) {
        if (!this.initialOffset || updateOffset) {
            this.setOffset();
        }

        if (this.isFollowing) {
            this.mesh._scene.unregisterBeforeRender(this._followingCallback);
            this.isFollowing = false;
            this._followingCallback = null;
        }
        else {
            this._followingCallback = this.follow.bind(this);
            this.mesh._scene.registerBeforeRender(this._followingCallback);
            this.isFollowing = true;
        }
    }

    enable(updateOffset=false) {
        // Set offset if needed
        if (!this.initialOffset || updateOffset) {
            this.setOffset();
        }

        if (this.isFollowing) {
            return;
        }
        else {
            this._followingCallback = this.follow.bind(this);
            this.mesh._scene.registerBeforeRender(this._followingCallback);
            this.isFollowing = true;
        }
    }

    disable() {
        if (this.isFollowing) {
            this.mesh._scene.unregisterBeforeRender(this._followingCallback);
            this.isFollowing = false;
            this._followingCallback = null;
        }
        else {
            return;
        }
    }
}