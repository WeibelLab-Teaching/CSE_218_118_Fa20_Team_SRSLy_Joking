class Momentum {

    /**
     * Object for monitoring an object's movements.
     * You must implement the update loop. eg:
     * 
     * p = new Momentum(userCamera);
     * scene.onBeforeRenderObservable.add(function() {
     *      p.recordPose();
     * })
     * 
     * @param objectToTrack The object that you want to track
     */
    constructor(objectToTrack) {
        this.target = objectToTrack;
        this.poseHistory = []
        this.pose = null;
    }

    /**
     * Save camera pose and trim history
     */
    recordPose() {
        let pos = this.target.position.asArray();
        let rot = this.target.rotationQuaternion.toEulerAngles().asArray();
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

    /**
     * Averages the pose of the target over the last second
     * TODO: move to Kalman filter and predict x_k^-
     */
    calculateTrend() {
        // average vector
        let sum = math.zeros(4, 4).toArray();

        for (let pose of this.poseHistory) {
            math.forEach(pose.pose.T.toArray(), (value, index, matrix) => {
                sum[index[0]][index[1]] += value
            })
        }

        let avg = math.zeros(4, 4).toArray();
        math.forEach(sum, (value, index, matrix) => {
            avg[index[0]][index[1]] = value / this.poseHistory.length;
        })
        return avg;
    }

    calculateRelativePose(x, outputType="babylon") {
        let poi = Pose.MatrixFromBabylonMatrix(x.getWorldMatrix());
        let relativeTo = this.pose;

        let relative = math.multiply( math.inv(relativeTo), poi );

        switch (outputType) {
            case "babylon":
                return Pose.MatrixToBabylon(relative);
            case "pose":
                return new Pose(relative);
            case "matrix":
            default:
                return relative;
        }
        return relative;
    }
}

/**
 * Class for storing and manupulating transformation matricies
 */
class Pose {
    /**
     * Converts euclidian geometry into a transformation matrix for easy operations
     * @param position euclidian position in whatever coordinate system you're using. 
     * This can be replaced with a matrix if you just want a Pose object for a known transformation matrix
     * @param rotation euclidian rotation in radians
     */
    constructor() {
        if (arguments.length === 1) {
            if (arguments[0] instanceof math.matrix) {
                this.T = arguments[0];
            }
            else if (typeof(arguments[0]) === "object" && arguments[0].length === 4 && arguments[0][0].length === 4) {
                this.T = math.matrix(arguments[0]);
            }
            else {
                this.T = math.matrix([
                    [1, 0, 0, arguments[0][0]], 
                    [0, 1, 0, arguments[0][1]], 
                    [0, 0, 1, arguments[0][2]],
                    [0, 0, 0, 1]
                ])
            }

        }
        else if (arguments.length === 2) {
            /*
            Rotation matrix is definied by the combination of X, Y, and Z rotation matricies
            R = Z dot Y dot X
            */
            let position = arguments[0];
            let rotation = arguments[1]

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
        else {
            console.error("Got", arguments.length, "arguments in Pose constructor\n", arguments);
        }
    }

    /**
     * 1D array of position: [1, 2, 3] where [x, y, z]
     */
    get position() {
        return math.squeeze(this.T.subset(math.index(math.range(0, 3), 3))).toArray();
    }

    /**
     * BABYLON.Vector3 of position
     */
    get positionVector() {
        let pos = this.position;
        return new BABYLON.Vector3(pos[0], pos[1], pos[2]);
    }

    /**
     * 3x3 math.matrix of rotation
     */
    get rotationMatrix() {
        return this.T.subset(math.index(math.range(0, 3), math.range(0, 3)));
    }

    static MatrixFromBabylonMatrix(babMat) {
        let v = babMat.toArray();
        let mat = math.matrix([
            [v[0], v[4], v[8], v[12]],
            [v[1], v[5], v[9], v[13]],
            [v[2], v[6], v[10], v[14]],
            [v[3], v[7], v[11], v[15]]
        ])
        return mat;
    }

    static MatrixToBabylon(mat) {
        let transposedValues = math.transpose(mat).reshape([16]).toArray();
        return BABYLON.Matrix.FromArray(transposedValues);
    }
}