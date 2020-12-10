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
    }

    stop() {
        this.mediaRecorder.stop();
        console.log("Stopping recording...");
        console.log(this.mediaRecorder.state);
    }

    start() {


        // Combines all the audio streams into one
        this.audioContext  = new AudioContext();

        const dest = this.audioContext.createMediaStreamDestination();
        this.audioStreams.forEach(audioStream => {
            const source = this.audioContext.createMediaStreamSource(audioStream);
            console.log(audioStream)
            source.connect(dest);
        });

        var mixedAudioTracks = dest.stream.getTracks()[0];

        const stream = new MediaStream([mixedAudioTracks]);
        console.log(stream)
        console.log(this.audioStreams)



        // saves the chunks of the recording
        this.chunks = []

        // intiates the recorder
        this.mediaRecorder = new MediaRecorder(stream);

        // below code is used to save the audio, taken from https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
        this.mediaRecorder.onstop = function(e) {
            console.log("data available after MediaRecorder.stop() called.");
      
            var clipName = prompt('Enter a name for your sound clip');
      
            var clipContainer = document.createElement('article');
            var clipLabel = document.createElement('p');
            var audio = document.createElement('audio');
            var deleteButton = document.createElement('button');
           
            clipContainer.classList.add('clip');
            audio.setAttribute('controls', '');
            deleteButton.innerHTML = "Delete";
            clipLabel.innerHTML = clipName;
      
            clipContainer.appendChild(audio);
            clipContainer.appendChild(clipLabel);
            clipContainer.appendChild(deleteButton);
            soundClips.appendChild(clipContainer);
      
            audio.controls = true;
            var blob = new Blob(this.chunks, { 'type' : 'audio/ogg; codecs=opus' });
            this.chunks = ["test"];
            var audioURL = URL.createObjectURL(blob);
            audio.src = audioURL;
            console.log("recorder stopped");
      
            deleteButton.onclick = function(e) {
              evtTgt = e.target;
              evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
            }.bind(this)

            console.log(this.chunks)
          }.bind(this)
          
        this.mediaRecorder.ondataavailable = function(e) {
            console.log(this.chunks)
            this.chunks.push(e.data);
        }.bind(this)

        this.mediaRecorder.start();
        console.log("Starting recording...");
        console.log(this.mediaRecorder.state);
    }

    addAudioStream(audioStream) {
        this.audioStreams.push(audioStream)
    }
  
}