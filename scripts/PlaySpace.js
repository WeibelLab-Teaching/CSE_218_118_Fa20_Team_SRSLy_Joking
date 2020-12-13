// play_area: [
//     [1, 0, 1],
//     [1, 0, -1],
//     [-1, 0, -1],
//     [-1, 0, 1]
// ],

class PlaySpace {
    // ==========	Instance Variables	==========

    get area() {return ApplicationState.play_area}
    set area(value) {ApplicationState.play_area = value; pushAppState()}

    constructor() {
    }

    addPoint(point) {
        
        this.area.push(point);
    }

    reset() {
        this.area = [];

        // TODO: set in mode to allow user to set corners
    }
}