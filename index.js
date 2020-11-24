const express = require('express');
const fs = require('fs');
const https = require('https');
const app = express();
const { networkInterfaces } = require('os');

const PORT = 3000;

app.get('/', (req, res) => {
    res.sendFile(__dirname+"/pages/main.html");
    console.log("sent main.html");
})

app.use("/js", express.static(__dirname+'/scripts/'));
app.use("/jquery.js", express.static(__dirname+"/node_modules/jquery/dist/jquery.js"));
app.use("/babylon.js", express.static(__dirname+"/node_modules/babylonjs/babylon.js"));
app.use("/assets", express.static(__dirname+"/assets/"));
app.use("/math.js", express.static(__dirname+"/node_modules/mathjs/lib/browser/math.js"))
app.use("/favicon.ico", express.static(__dirname+"/assets/favicon.ico"));

/*
=====================================
        RUN SERVER
=====================================
*/
https.createServer({ // need https for webcam
    key: fs.readFileSync(__dirname+'/cert/server.key'),
    cert: fs.readFileSync(__dirname+'/cert/server.cert')
}, app)
.listen(3000, (err) => {
    if (err) console.log("Error starting express server");

    // Get IP
    let nets = networkInterfaces();
    let results = Object.create(null); // or just '{}', an empty object
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
    
                results[name].push(net.address);
            }
        }
    }
    console.log(results);
    let ip = results[Object.keys(results)[0]][0]
    console.log("Hosting Server on https://"+ip+":"+PORT.toString());
})