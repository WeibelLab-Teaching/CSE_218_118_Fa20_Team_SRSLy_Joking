class Momentum {

    /**
     * 
     * @param objectToTrack The object that you want to track
     */
    constructor(objectToTrack) {
        this.target = objectToTrack;
        this.poseHistory = []
        this.pose = null;
    }

    recordPose() {
        let pos = this.target.position.asArray();
        let rot = this.target.rotation.asArray();
        let pose = new Pose(pos, rot);
        let timestamp = new Date().getTime();

        this.poseHistory.push({
            "pose":pose,
            "timestamp": timestamp
        });

        // cleanup history
        let keepSecondsOfHistory = 1 * 1000 // number of milliseconds to keep
        for (let i=this.poseHistory.length-1; i>=0; i--) {
            if (this.poseHistory[i].timestamp < timestamp - keepSecondsOfHistory) {
                // Remove all elements before this timepoint
                this.poseHistory.splice(0, i);
                break;
            }
        }

        this.pose = this.calculateTrend()
    }

    calculateTrend() {
        // average vector
        let sum = math.identity(4);

        for (let pose of this.poseHistory) {
            sum = math.multiply(sum, pose.pose.T)
        }

        let avg = math.divide(sum, this.poseHistory.length);
        return avg;
    }
}

/**
 * Class for storing and manupulating transformation matricies
 */
class Pose {
    /**
     * Converts euclidian geometry into a transformation matrix for easy operations
     * @param position euclidian position in whatever coordinate system you're using
     * @param rotation euclidian rotation in radians
     */
    constructor(position, rotation) {
        if (rotation === null) {
            this.T = math.matrix([
                [1, 0, 0, position[0]], 
                [0, 1, 0, position[1]], 
                [0, 0, 1, position[2]],
                [0, 0, 0, 1]
            ])
        }
        else {
            /*
            Rotation matrix is definied by the combination of X, Y, and Z rotation matricies
            R = Z dot Y dot X
            */

            let X = math.matrix([ // rotation about x-axis
                [1, 0, 0],
                [0, Math.cos(rotation[0]), -Math.sin(rotation[0])],
                [0, Math.sin(rotation[0]), Math.cos(rotation[0])]
            ])

            let Y = math.matrix([ // rotation about y-axis
                [Math.cos(rotation[1]), 0, Math.sin(rotation[1])],
                [0, 1, 0],
                [-Math.sin(rotation[1]), 0, Math.cos(rotation[1])]
            ])

            let Z = math.matrix([ // rotation about z-axis
                [Math.cos(rotation[2]), -Math.sin(rotation[2]), 0],
                [Math.sin(rotation[2]), Math.cos(rotation[2]), 0],
                [0, 0, 1]
            ])

            let rotationMatrix = math.multiply(Z, Y, X)
            let transformationMatrix = math.resize(rotationMatrix, [4,4])
            transformationMatrix.subset(math.index(math.range(0, 4), 3), [position[0], position[1], position[2], 1])
            
            this.T = transformationMatrix
        }
    }

    get position() {
        return this.T.subset(math.index(math.range(0, 3), 3));
    }

    get rotationMatrix() {
        return this.T.subset(math.index(math.range(0, 3), math.range(0, 3)));
    }
}