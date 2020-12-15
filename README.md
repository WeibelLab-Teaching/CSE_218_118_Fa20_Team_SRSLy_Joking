# Walk and Talk
![logo2](https://user-images.githubusercontent.com/23105064/102200526-cca0fe80-3e79-11eb-8889-0a0b40cc71d5.png)

Walk and Talk is a platform for mobile teleconferencing in extended reality (XR) using WebXR, built on BabylonJs. The application specifically facilitates virtual walking meetings. 

### Index
  * [Motivation and Impact](#motivation-and-impact)
  * [Features](#features)
    + [Multimodal Collaboration](#multimodal-collaboration)
    + [Avatars and Movement](#avatars-and-movement)
    + [Choice of Walking Environment](#choice-of-walking-environment)
    + [Walking Area Setup](#walking-area-setup)
    + [Participant Positioning](#participant-positioning)
    + [Recording Audio Snippets](#recording-audio-snippets)
    + [Desktop Client](#desktop-client)
  * [Demo](#demo)
  * [System Architecture](#system-architecture)
    + [WebRTC](#webrtc)
    + [Managing WebRTC and Avatars](#managing-webrtc-and-avatars)
  * [Getting Started](#getting-started)
    + [File Structure](#file-structure)
  * [The Walk and Talk Team](#the-walk-and-talk-team)
  * [Getting Help](#getting-help)


## Motivation and Impact
Most meetings today, especially with the increase in remote work, are done by sitting in front of a computer or laptop without much change in one's working environment. This has made the workday more sedentary for the average working individual and leads to negative physical and psychological consequences, including a higher risk of developing multiple chronic conditions. Light physical activity through the workday can counter these consequences as it has health benefits and improves happiness and satisfaction.

Walking meetings are an easy way to integrate light physical activity into the workday and have been shown boost creative thinking and help people stay focused and energized. However, it is currently difficult to walk or pace around during virtual meetings - app aims to facilitate virtual walking meetings and provide users with a relaxing change of scenery while maintaining a sense of presence by allowing users to see others’ videos, movements, or shared resources. 

Participants of virtual walking meetings could choose their own pace, or they could choose to not walk at all – making participation in walking meetings more accessible to everyone – something that isn’t possible with walking meetings in the physical world. Virtual walking or mobile meetings are also a natural evolution to the standing desk.



## Features 

### Multimodal Collaboration
Walk and Talk allows users to collaborate across different devices and supports both desktop and XR users. Meeting participants can choose their most comfortable position and device.

<img src="https://user-images.githubusercontent.com/23105064/102201440-f73f8700-3e7a-11eb-91e4-e1ef4b56732f.png" width="250"/>

### Avatars and Movement
XR users appear as avatars and desktop users appear as TVs with robot bodies. XR avatars also move their heads based on the corresponding user’s head pose.

<img src="https://user-images.githubusercontent.com/23105064/102201463-fe669500-3e7a-11eb-90c3-3531a1a05b46.PNG" width="350"/> <img src="https://user-images.githubusercontent.com/23105064/102202189-e6434580-3e7b-11eb-99d5-62158c68e2fc.gif" width="350"/>

### Choice of Walking Environment
XR users can choose between different environments to walk in using their control panel. The images below show a user changing their enviornment from a forest to a beach scene.

<img src="https://user-images.githubusercontent.com/23105064/102203654-b4cb7980-3e7d-11eb-94ce-734cb5c174eb.png" width="900"/>

### Walking Area Setup
Users can set up the space they can walk around in and aspects of the environment (like trees or rocks) will be generated in spaces where they cannot walk to keep them safe.

<img src="https://user-images.githubusercontent.com/23105064/102204041-33281b80-3e7e-11eb-9c3a-b4bebf417902.png" width="900"/>

### Participant Positioning
Users can toggle between two modes of participant positioning - Meeting participants can either stay in a static location in the environment, or they can follow the user as they walk around. 

<img src="https://user-images.githubusercontent.com/23105064/102204425-b6497180-3e7e-11eb-9659-1e643f061f9b.png" width="350"/>

### Recording Audio Snippets
Users can record audio snippets using a button in their control panel.

<img src="https://user-images.githubusercontent.com/23105064/102204689-ff99c100-3e7e-11eb-90fe-6b160879c2c4.png" width="350"/>

### Desktop Client
Non-XR users can join meetings using the desktop client. These users can also share their screen that can be viewed by both XR and Non-XR participants.

<img src="https://user-images.githubusercontent.com/23105064/102206107-f578c200-3e80-11eb-93b9-a68fec39ae68.png" width="900"/>

## Demo
[![demo](https://user-images.githubusercontent.com/23105064/102267918-6c3cac00-3ecf-11eb-8a11-9fec6b8a5a95.png)](https://youtu.be/lbZkL-YcHFk)



## System Architecture

<img src="https://user-images.githubusercontent.com/23105064/102205516-24daff00-3e80-11eb-99ca-2f92787f0519.png" width="550"/>



### WebRTC
We use an SFU architecture for WebRTC (with the MediaSoup package) to ensure that numerous clients can simultaneously connect and communicate. This diagram illustrates how a user can join a room or meeting.

<img src="https://user-images.githubusercontent.com/23105064/102205273-d4fc3800-3e7f-11eb-9160-ede692048f79.png" width="800"/> 

### Managing WebRTC and Avatars

These WebRTC connections consist of various identified elements (producers, consumers, and sockets); all of which are unlinked. In order to link these and their respective Videos and Avatars, we created a series of classes and event systems which allow for identifiers to propagate outwards, accumulating pairs by various means so that everything syncs together.

<img src="https://user-images.githubusercontent.com/23105064/102205271-d463a180-3e7f-11eb-874e-36b2e26f9c34.jpg" width="800"/>



## Getting Started
1. Download Node.js and NPM
   1. Windows and Mac: [download installer](https://nodejs.org/en/download/)
   2. Linux: `sudo apt install nodejs npm`
2. Clone this repository - `git clone https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking.git`
3. Enter the project folder, run `npm install`. Let the downloads finish.
   This will install a series of dependencies through the Node Package Manager (NPM) these packages are all monitored by NPM and checked for security.
4. Set WebRTC Host IP
   1. Get your local ip address:
      1. Open terminal/powershell
         1. Mac/Linux: `ifconfig | grep 192`
         2. Windows: `ipconfig`
      2. Use the address that is of the form `192.168.x.x` (eg: `192.168.1.127`)
   2. Add your IP to `.../webrtc_server_scripts/config.js` line 63: `announcedIp:'192.168.1.127' // replace by public IP address`
5. From Terminal, run `npm start` to start the server
6. Go to https://localhost 
   1. If you want to access from remote devices, you will need to generate a self signed certificate. Instructions for doing this can be found [here](https://nodejs.org/en/knowledge/HTTP/servers/how-to-create-a-HTTPS-server/).
   2. Copy the `cert` and `key` files into `.../cert/`
   3. You can now access secure content (video feeds) from any device in your local area network.

### File Structure
- [index.js](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/index.js) is the main server file and is used to initialize all routes, the https server, and initializes all the webrtc_server_script objects and logic for webrtc rooms.

- [assets](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/tree/main/assets) includes the visual assets (like 3D models) used in the app.

- [pages](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/tree/main/pages)
  + [main](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/pages/main.html): Main XR application
  + [webrtc.html](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/pages/webrtc.html): A development version of [main](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/pages/main.html)
  + [webrtc_nonvr](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/pages/webrtc_nonvr.html): Desktop Client

- [scripts](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/tree/main/scripts) houses the client side scripts.
  + [RoomClient.js](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/scripts/RoomClient.js): Client side organization of all the webrtc information on the client pov
  + [Streamer.js](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/scripts/Streamer.js): Client side organization of videos of different participants (`VideoStreamer.js` and `AvatarStreamer.js` are children of this class)
  + [PlaySpace.js](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/scripts/PlaySpace.js): A class for managing the area in which the user can walk around in
+ [Environment.js](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/scripts/Environment.js): Class managing the generation of the virtual environments for the users
  + [Momentum.js](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/scripts/Momentum.js) and [Follower.js](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/scripts/Follower.js) keep elements with the user as they walk
  + [webrtc_index.js](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/scripts/webrtc_index.js): A file to declare all client-side functions that help with joining rooms and setting up mic/video devices to be used for webrtc
  + [PCPair.js](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/blob/main/scripts/PCPair.js): Keeps sockets, webrtc producers and consumers, video streamers, and avatars streamers organized and linked together.
- [scripts_serverside](https://github.com/WeibelLab-Teaching/CSE_218_118_Fa20_Team_SRSLy_Joking/tree/main/scripts_serverside) is a folder containing scripts specific for running the server and setup the data for user's webrtc transports and a meeting room's webrtc information.



## The Walk and Talk Team
Team Name: SRSLy Joking

Team Members
- [Eric Siu](https://siueric0010.github.io/): Undergraduate student at UC San Diego
- [Naba Rizvi](https://nrizvi.github.io/): PhD student at UC San Diego
- [Tommy Sharkey](https://www.tlsharkey.com/): PhD student at UC San Diego
- [Stephen Liu](https://github.com/qixinliu): Undergraduate student at UC San Diego
- [Janet Johnson](http://janetjohnson.info/): PhD student at UC San Diego



## Getting Help 
The Walk and Talk team is responsible for maintaining this project. Should you need additional help, you can contact our team at [srslyjoking.ucsd@gmail.com](mailto:srslyjoking.ucsd@gmail.com?subject=[GitHubQuery]%20Walk&Talk).

You can find general support for the technologies we use here:
- [Babylon.js](https://doc.babylonjs.com/) 
- [Node.js](https://nodejs.org/en/)
- [WebRTC](https://webrtc.org/)

Additional background on the project can be found in our [Midterm Presentation](https://youtu.be/A6hXnWrjom4), and our [Final Presentation]( https://youtu.be/Ez_tEaSsgGo)
