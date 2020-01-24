const express = require('express');
const path = require('path');
const SocketServer = require('ws').Server;

const PORT = process.env.PORT || 3000;

const server = express()
  .use(express.static(__dirname))
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

const wss = new SocketServer({server});

var mobHP = 1000;
var resetting = false;

function onConnect(ws){
  console.log("Client connected");
  ws.on("message", msg=>onMessage(ws,msg));
  ws.on("close", msg=>onClose(ws));
}

function onMessage(ws,msg){
  var data = JSON.parse(msg);
  if(data.type == "attack"){ //on attack
    mobHP-=data.damage;
    if(mobHP <= 0){ //dead
      mobHP = 0
      if(!resetting){ //reset hp
        resetting = true;
        setTimeout(()=>{mobHP=1000;resetting=false},10000);
      }
    }
  }
}

function onClose(ws){
  console.log("deded");
}

function msgAll(data){
  wss.clients.forEach( client=>{
    client.send(JSON.stringify(data));
  });
}

wss.on("connection", onConnect);

function updateClients(){
  var data = {type: "update"};
  //hp
  data.mobHP = mobHP;
  //client nums
  data.numClients = wss.clients.size;
  msgAll(data);
}

setInterval(updateClients,3000); //update clients every interval
