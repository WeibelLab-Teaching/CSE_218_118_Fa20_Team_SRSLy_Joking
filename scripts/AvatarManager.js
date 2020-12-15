/*
================================================================================
        ABOUT
================================================================================
This file will contiain functions for assisting with the synchronization of
avatars between clients
*/


/**
 * Sends the user's headpose to the other connected users.
 * @param {4x4 matrix} transform The transformation matrix of the head
 */
function sendPose() {
	// Sending 2 types of poses:
	// 1. the world pose
	// 2. the pose relative to the momentum.
	// LOG("Sending Pose");
	ws.send(JSON.stringify({
		type:"POSE",
		id: ApplicationState.id,
		world: {
			head: userCamera? userCamera.getWorldMatrix().toArray(): null,
			lhand: userLHand? userLHand.getWorldMatrix().toArray(): null,
			rhand: userRHand? userRHand.getWorldMatrix().toArray(): null
		},
		relative: {
			head: userCamera? p.calculateRelativePose(userCamera, "babylon").toArray(): null,
			lhand: userLHand? p.calculateRelativePose(userLHand, "babylon").toArray(): null,
			rhand: userRHand? p.calculateRelativePose(userRHand, "babylon").toArray(): null
		}
	}))

	setTimeout(sendPose, 30); // Change the delay to increase or decrease pose update frequency
}

function chooseAvatar(callback) {
	let uri = prompt("Select your avatar (input the uri)", "/assets/avatars/avatar/dummy2.babylon");
	callback(uri);
}