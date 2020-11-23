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
    }

    follow() {
        this.mesh.position.x = this.target.position.x + this.initialOffset.x;
        this.mesh.position.z = this.target.position.z + this.initialOffset.z;
        // TODO: add smoothing
    }

    setOffset() {
        this.initialOffset = this.mesh.position.subtract(this.target.position);
        console.log("[Follower] offset set to", this.initialOffset);
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