const express = require('express');
const WebSocket = require('ws');
const http = require('http');
var nopt = require('nopt');
var osc = require('osc');

const stderr = process.stderr;

const knownOpts = {
    "ws-port": [Number, null],
    "osc-send-port": [Number, null],
    "help": Boolean
};

const shortHands = {
    "w": ["--ws-port"],
    "s": ["--osc-send-port"]
};

const parsed = nopt(knownOpts, shortHands, process.argv, 2);

var httpServer = http.createServer();
var expressServer = express();
expressServer.use(express.static(__dirname));
httpServer.on('request', expressServer);

var wsPort = parsed['ws-port'];
if (wsPort == null) wsPort = 8001;

//setup abletonlink-addon
const AbletonLink = require("abletonlink-addon");
const link = new AbletonLink();

var wss = new WebSocket.Server({ server: httpServer });

wss.broadcast = function(data) {
    for (let i of wss.clients) i.send(data);
};

setInterval(function() {
    try { wss.broadcast(JSON.stringify({ 'type': "linkBeat", 'beat': link.getBeat(), 'phase': link.getPhase() })); } catch (e) { stderr.write("warning: exception in WebSocket send\n"); }
}, 2);

setInterval(function() {
    //io.sockets.send('message');
    try {
        wss.broadcast(JSON.stringify({
            'type': "linkInfos",
            'numPeers': link.getNumPeers(),
            'quantum': link.getQuantum(),
            'tempo': link.getTempo()
        }));
    } catch (e) { stderr.write("warning: exception in WebSocket send\n"); }
}, 3000);

httpServer.listen(wsPort, () => {
    console.log('Link server is listening on port ' + wsPort);
});