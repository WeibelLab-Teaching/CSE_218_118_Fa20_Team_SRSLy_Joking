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
	ws.send(JSON.stringify({
		type:"POSE",
		head: userCamera? userCamera.getWorldMatrix().toArray(): null,
		lhand: userLHand? userLHand.getWorldMatrix().toArray(): null,
		rhand: userRHand? userRHand.getWorldMatrix().toArray(): null
	}))

	setTimeout(sendPose, 1000); // Change the delay to increase or decrease pose update frequency
}

function chooseAvatar(callback) {
	let uri = prompt("Select your avatar (input the uri)", "/assets/avatars/Dude/Dude.babylon");
	callback(uri);
}