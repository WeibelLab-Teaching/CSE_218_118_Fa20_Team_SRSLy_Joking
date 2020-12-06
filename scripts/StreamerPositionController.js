class StreamerPositionController {
    constructor() {

        this.positions = [
            new BABYLON.Vector3(-1, 2, 0.2),
            new BABYLON.Vector3(-0.7, 2, 0.7),
            new BABYLON.Vector3(0, 2, 1),
            new BABYLON.Vector3(0.7, 2, 0.7),
            new BABYLON.Vector3(1, 2, 0.2)
        ]

        this.videosInController = [
            null,
            null,
            null,
            null,
            null

        ]
    }

    getNewPosition(currVideo) {
        let positionCount = 0
        for (let video of this.videosInController) {
            if (video == null) {
                this.videosInController[positionCount] = currVideo
                break
            }
            positionCount++
        }

        // Only if we run out of positions
        if(positionCount > this.positions.length) {
            // Create a new row of positions if we ran out (creates the positions in order of left to right)
            for(i = 4; i >= 0; i--) {
                this.positions.push(new BABYLON.Vector3(this.positions[positionCount - i].x, this.positions[positionCount - i].y + 0.5, this.positions[positionCount - i].z))

            }

            // create one more row of  possible video feeds
            for(i = 0; i < 5; i++) {
                this.videosInController.push(null)
            }
        }

        return this.positions[positionCount]
    }

    removePosition(currVideo) {
        let positionCount = 0
        
        for (let video of this.videosInController) {
            if (video == currVideo) {
                this.videosInController[positionCount] = null
                break
            }
            positionCount++
        }
    }

}