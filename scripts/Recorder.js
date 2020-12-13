class Recorder {
    constructor() {

        // Combines all the audio streams into one
        this.audioContext  = null;

        // saves the chunks of the recording
        this.chunks = []

        // intiates the recorder
        this.mediaRecorder = null

        // carries the audio streams
        this.audioStreams = []

        // checks if we are currently recording
        this.isRecording = false
    }

    // ONly happens when a user presses the stop record button
    stop() {
        this.mediaRecorder.stop();
        console.log("Stopping recording...");
        console.log(this.mediaRecorder.state);
        rc.event(RoomClient.EVENTS.stopRecord);
        this.isRecording = false
    }

    // Only happens when a user presses the start button on the record button
    start() {
        // get the new stream from the different audio tracks
        const stream = this.createNewStream(); 

        // saves the chunks of the recording
        this.chunks = []

        // intiates the recorder
        this.mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/ogg; codecs=opus'});

        // below code is used to save the audio, taken from https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
        this.mediaRecorder.onstop = function(e) {
            this._onStopRecorderCallBack(e);
        }.bind(this);
          
        this.mediaRecorder.ondataavailable = function(e) {
            console.log(this.chunks)
            this.chunks.push(e.data);
        }.bind(this)

        this.mediaRecorder.start();
        console.log("Starting recording...");
        console.log(this.mediaRecorder.state);

        this.isRecording = true
        rc.event(RoomClient.EVENTS.startRecord);
    }

    // restarts the media recorder without removing chunks, allowing for the full file
    startWithoutRemovingChunks() {
        // Do nothing on stop, just restart the stream
        this.mediaRecorder.onstop = null
        this.mediaRecorder.stop();
        console.log("Stop with a null function")

        const stream = this.createNewStream(); 


        // intiates the recorder
        this.mediaRecorder = new MediaRecorder(stream, {mimeType: 'audio/ogg; codecs=opus'});
        console.log(this.mediaRecorder)

        // below code is used to save the audio, taken from https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
        this.mediaRecorder.onstop = function(e) {
            this._onStopRecorderCallBack(e);
        }.bind(this);
          
        this.mediaRecorder.ondataavailable = function(e) {
            console.log(this.chunks)
            this.chunks.push(e.data);
        }.bind(this)

        this.mediaRecorder.start();
        console.log("Starting recording...");
        console.log(this.mediaRecorder.state);

        rc.event(RoomClient.EVENTS.startRecord);
    }

    // Adds a new audio from another user
    addAudioStream(audioStream) {
        this.audioStreams.push(audioStream)
        if(this.isRecording) {
            this.startWithoutRemovingChunks();
        }
    }
  


    // helper functions

    createNewStream() {
        // Combines all the audio streams into one
        this.audioContext  = new AudioContext();

        const dest = this.audioContext.createMediaStreamDestination();
        this.audioStreams.forEach(audioStream => {
            const source = this.audioContext.createMediaStreamSource(audioStream);
            console.log(audioStream)
            source.connect(dest);
        });

        var mixedAudioTracks = dest.stream.getTracks()[0];
        return new MediaStream([mixedAudioTracks]);
    }


    // This callback happens when the recorder is stopped via button.
    _onStopRecorderCallBack(e) {

        console.log("data available after MediaRecorder.stop() called.");
      
        var clipName = prompt('Enter a name for your sound clip');

        var i;
        for(i = -1; i < this.chunks.length; i++) {

            var clipContainer = document.createElement('article');
            var clipLabel = document.createElement('p');
            var audio = document.createElement('audio');
            var deleteButton = document.createElement('button');
            var link = document.createElement("a"); 
           
            clipContainer.classList.add('clip');
            audio.setAttribute('controls', '');
            deleteButton.innerHTML = "Delete";
      
            clipContainer.appendChild(audio);
            clipContainer.appendChild(clipLabel);
            clipContainer.appendChild(deleteButton);
            soundClips.appendChild(clipContainer);
      
            audio.controls = true;


            if(i == -1) {
                var blob = new Blob(this.chunks, {'type' : 'audio/ogg; codecs=opus'});
                var audioURL = URL.createObjectURL(blob);
        
            } else {
                var blob = new Blob([this.chunks[i]], {'type' : 'audio/ogg; codecs=opus'});
                var audioURL = URL.createObjectURL(blob);
            }

            audio.src = audioURL;
            console.log("recorder stopped");
      
            deleteButton.onclick = function(e) {
              evtTgt = e.target;
              evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
            }.bind(this)
    
            console.log(this.chunks)
    
            var link = document.createElement("a"); // Or maybe get it from the current document
            link.href = audioURL;
            if(i == -1) {
                clipLabel.innerHTML = clipName + "_full";
                link.download = clipName + "_full.ogg";
            } else {
                clipLabel.innerHTML = clipName + "_" + i;
                link.download = clipName + ".mp3";
            }
            link.innerHTML = "Click here to download the file";
            clipContainer.appendChild(link); // Or append it whereever you want
        }
        

    } 
}