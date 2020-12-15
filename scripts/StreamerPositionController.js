class StreamerPositionController {
    constructor() {

        this.positions = [
            new BABYLON.Vector3(-1, 1.5, 0.2),
            new BABYLON.Vector3(-0.7, 1.5, 0.7),
            new BABYLON.Vector3(0, 1.5, 1),
            new BABYLON.Vector3(0.7, 1.5, 0.7),
            new BABYLON.Vector3(1, 1.5, 0.2)
        ]

        this.videosInController = [
            null,
            null,
            null,
            null,
            null

        ]

        this.countPerRow = 5
    }

    getNewPosition(currVideo) {
        let countPerRow = this.countPerRow
        let positionCount = 0
        for (let video of this.videosInController) {
            if (video == null) {
                this.videosInController[positionCount] = currVideo
                break
            }
            positionCount++
        }
        console.log(this.videosInController)
        console.log(positionCount)

        // Only if we run out of positions
        if(positionCount >= this.positions.length) {
            // Create a new row of positions if we ran out (creates the positions in order of left to right)
            var i;
            for(i = countPerRow; i > 0; i--) {
                this.positions.push(new BABYLON.Vector3(this.positions[positionCount - i].x, this.positions[positionCount - i].y + 0.25, this.positions[positionCount - i].z))
                console.log(this.positions)
            }

            // create one more row of  possible video feeds
            for(i = 0; i < countPerRow; i++) {
                console.log(this.videosInController)
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