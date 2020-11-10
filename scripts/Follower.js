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
        self = arguments[0];
        self.mesh.position.x = self.target.position.x + self.initialOffset.x;
        self.mesh.position.z = self.target.position.z + self.initialOffset.z;
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
            this.mesh._scene.unregisterBeforeRender(() => {this.follow(this)});
            this.isFollowing = false;
        }
        else {
            this.mesh._scene.registerBeforeRender(() => {this.follow(this)});
            this.isFollowing = true;
        }
    }
}