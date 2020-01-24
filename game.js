var resize, tick, buffer, display, drawCanvas, anim, attack, ws, pNumClients;

//animation
//frame sets

var Animation = function(fsize, fsets, image, delay){
  //properties
  this.frame_size = fsize;
  this.frame_sets = fsets;
  this.image = image;
  this.count = 0;
  this.delay = delay;

  //method
  this.drawSprite = (g) => {
    var width = g.canvas.width;
    var height = g.canvas.height;
    var framePos = this.frame_sets[this.cFrame_set][this.cFrame] * 32;
    g.drawImage(image,
      framePos, 0, this.frame_size, this.frame_size,
      34, 34, this.frame_size, this.frame_size);
  };

  //next frame
  this.tick = () => {
    //update or not
    if(this.count >= delay){
      this.count = 0; //reset count

      //move to next frame
      if(this.cFrame >= this.frame_sets[this.cFrame_set].length - 1)
        this.cFrame = 0;
      else
        this.cFrame++;
    }
    this.count++; //increment count
  }

  //change frame set
  this.change = (i) => {
    this.cFrame_set = i;
  }

  //states
  this.cFrame_set = 0;
  this.cFrame = 0;
}

resize = () => {
  display.canvas.width = document.documentElement.clientWidth - 32;
  if(display.canvas.width > document.documentElement.clientHeight)
    display.canvas.width = document.documentElement.clientHeight;
  display.canvas.height = display.canvas.width;
   display.imageSmoothingEnabled = false;
}

tick = () => {
  drawCanvas();
  anim.tick();
  window.requestAnimationFrame(tick);
}

drawCanvas = () => {
  //draw buffer
  var width = buffer.canvas.width;
  var height = buffer.canvas.height;

  //background
  buffer.fillStyle = "#7ec0ff";
  buffer.fillRect(0, 0, width, height);

  //draw sprite
  anim.drawSprite(buffer);

  //draw hp bar
  buffer.fillStyle = "#008080";
  buffer.fillRect(10, 90, 80, 5);
  buffer.fillStyle = "#33cc33";
  buffer.fillRect(10,90,(mobHP/1000)*80,5);

  //draw on screen
  display.drawImage(buffer.canvas, 0, 0, width, height,
     0, 0, display.canvas.width, display.canvas.height);
}

var animReset; //timeout reset to idle
var damageDone = 0; //damage done this update
var mobHP = 1000; //mob's hp
var numClients = 1; //num of clients
attack = () => {
  anim.change(1); //change animation
  if(animReset) clearTimeout(animReset); //clear time out
  setTimeout(()=>{anim.change(0)}, 200); //reset to idle animation

  mobHP--;
  if(mobHP < 0) mobHP = 0;

  damageDone++;
}

function onMessage(event){
  var data = JSON.parse(event.data);
  if(data.type == "update"){
    mobHP = data.mobHP;
    numClients = data.numClients;
    pNumClients.innerHtml = `Online: ${numClients}`
    console.log(`hp: ${mobHP}\nclients: ${numClients}`);
  }
}

function updateServer(){
  //msg server damage
  msgServer({
    type: "attack",
    damage: damageDone,
  });
  damageDone = 0; //reset damage
}

function msgServer(data){
  ws.send(JSON.stringify(data));
}

window.onload = () => {
  //setup canvas
  buffer = document.createElement("canvas").getContext("2d");
  buffer.canvas.width = 100;
  buffer.canvas.height = 100;

  display = document.querySelector("canvas").getContext("2d");
  display.imageSmoothingEnabled = false;
  window.addEventListener('click',attack); //click event

  //setup Animation
  var image = new Image();
  image.src = "Sprite.png";
  anim = new Animation(32, [[0,1],[6]], image, 15);

  //websocket
  var HOST = location.origin.replace(/^http/,'ws');
  ws = new WebSocket(HOST);
  ws.onmessage = onMessage;

  //init//
  console.log('hi');

  pNumClients = document.querySelector("#numClients");

  window.addEventListener("resize",resize);
  resize();

  image.addEventListener("load",()=>{
    window.requestAnimationFrame(tick);
  })

  setInterval(updateServer,3000)


}
