//-----------------------------Map Generator Canvas------------------------------//
//Set onscreen canvas and its context
let onScreenCVS = document.querySelector(".generator");
let onScreenCTX = onScreenCVS.getContext("2d");

//Create an offscreen canvas. This is where we will actually be drawing, in order to keep the image consistent and free of distortions.
let offScreenCVS = document.createElement('canvas');
let offScreenCTX = offScreenCVS.getContext("2d");
offScreenCTX.fillStyle = "red";
//Set the dimensions of the drawing canvas
  offScreenCVS.width = 16;
  offScreenCVS.height = 10;

//Create an Image with a default source of the existing onscreen canvas
let img = new Image;
let source = offScreenCVS.toDataURL();

//Add event listeners for the mouse moving, downclick, and upclick
onScreenCVS.addEventListener('mousemove', handleMouseMove);
onScreenCVS.addEventListener('mousedown', handleMouseDown);
onScreenCVS.addEventListener('mouseup', handleMouseUp);

//We only want the mouse to move if the mouse is down, so we need a variable to disable drawing while the mouse is not clicked.
let clicked = false;

function handleMouseMove(e) {
    if (clicked) {
        draw(e)
    }
}

function handleMouseDown(e) {
    clicked = true;
    draw(e);
}

function handleMouseUp() {
    clicked = false;
}

//Helper functions

//Draw a single pixel on the canvas. Get the ratio of the difference in size of the on and offscreen canvases to calculate where to draw on the offscreen canvas based on the coordinates of clicking on the onscreen canvas.
function draw(e) {
    let ratio = onScreenCVS.width/offScreenCVS.width;
    if (offScreenCTX.fillStyle === "rgba(0, 0, 0, 0)") {
      offScreenCTX.clearRect(Math.floor(e.offsetX/ratio),Math.floor(e.offsetY/ratio),1,1);
    } else {
      offScreenCTX.fillRect(Math.floor(e.offsetX/ratio),Math.floor(e.offsetY/ratio),1,1);
    }
    //Set the source of the image to the offscreen canvas
    source = offScreenCVS.toDataURL();
    renderImage();
}

//Once the image is loaded, draw the image onto the onscreen canvas.
function renderImage() {
    img.onload = () => {
      //Prevent blurring
      onScreenCTX.imageSmoothingEnabled = false;
      onScreenCTX.clearRect(0,0,onScreenCVS.width,onScreenCVS.height);
      onScreenCTX.drawImage(img,0,0,onScreenCVS.width,onScreenCVS.height)
    }
    img.src = source;
}

//-------------------------------ToolBox----------------------------------//
let palette = document.querySelector('.color-select');

palette.addEventListener('click', selectColor)

function selectColor(e) {
  offScreenCTX.fillStyle = e.target.id;
  palette.childNodes.forEach(c => {
    if (c.childNodes[1]) {
      if (c.childNodes[1].id === e.target.id) {
        c.childNodes[1].className = "swatch-selected";
      } else {
        c.childNodes[1].className = "swatch";
      }
    } 
  });
}

//---------------------------Running the game-----------------------------//

//set scale of sprite
let SCALE = 2;

//Game Canvas
let gameCanvas = document.querySelector('.map');
let gameCtx = gameCanvas.getContext('2d');
gameCtx.imageSmoothingEnabled = false;
//coordinates of mouse
let mouseX;
let mouseY;
//start with mouse outside of gameCanvas
let mousePresent = false;

function collide(obj1,obj2) {
  let yOverlap = !!((obj1.yMin < obj2.yMax)&&(obj1.yMax > obj2.yMin));
  let xOverlap = !!((obj1.xMin < obj2.xMax)&&(obj1.xMax > obj2.xMin));
  
  let leftOf2 = !!(obj1.center<obj2.center);
  let rightOf2 = !!(obj1.center>obj2.center);
  let upOf2 = !!(obj1.z<obj2.z);
  let downOf2 = !!(obj1.z>obj2.z);

  let checkEast = !!((obj1.xMax+Math.sign(obj1.xD) >= obj2.xMin)&&yOverlap&&leftOf2);
  let checkWest = !!((obj1.xMin+Math.sign(obj1.xD) <= obj2.xMax)&&yOverlap&&rightOf2);
  let checkSouth = !!((obj1.yMax+Math.sign(obj1.yD) >= obj2.yMin)&&xOverlap&&upOf2);
  let checkNorth = !!((obj1.yMin+Math.sign(obj1.yD) <= obj2.yMax)&&xOverlap&&downOf2);

  switch(true) {
    case checkEast:
      obj2.color = "#4d00c7";
      break;
    case checkWest:
      obj2.color = "#4d00c7";
      break;
    case checkSouth:
      obj2.color = "#b600c7";
      break;
    case checkNorth:
      obj2.color = "#b600c7";
      break;
    case (xOverlap&&!yOverlap):
      obj2.color = "red";
      break;
    case (!xOverlap&&yOverlap):
      obj2.color = "blue";
      break;
    case (xOverlap&&yOverlap):
      obj2.color = "#4d00c7";
      break;
    default: 
      obj2.color = "black";
  }

  if (checkEast||checkWest) {
    obj1.unMoveX();
  }

  if (checkSouth||checkNorth) {
    obj1.unMoveY();
  }
}

class Box {
  constructor(width, height, x, y) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.color = "black";
    Box.all.push(this);
  }
  get z() {return this.y+this.height*0.75}
  get center() {return this.x+this.width/2}
  get xMax() {return this.x+this.width;}
  get yMax() {return this.y+this.height;}
  get xMin() {return this.x;}
  get yMin() {return this.y;}

  draw() {
    gameCtx.fillStyle = this.color;
    gameCtx.fillRect(this.x, this.y,this.width, this.height);
    gameCtx.fillRect(this.x, this.y-this.height, this.width, this.height);
    gameCtx.fillStyle = "rgba(255, 255, 255, 0.5)";
    gameCtx.fillRect(this.x, this.y-this.height, this.width, this.height);
  }
}

class Skeleton {
  constructor(spritesheet, rawWidth, rawHeight, speed, x, y) {
    this.spritesheet = spritesheet;
    this.rawWidth = rawWidth;
    this.rawHeight = rawHeight;
    this.speed = speed;
    this.x = x;
    this.y = y;
    //vectors
    this.xD = 0;
    this.yD = 0;
    this.angle = 0;
    this.vector = 1;
    //collisions
    this.collideX = false;
    this.collideY = false;
    //state
    this.moving = false;
    this.deathState = false;
    this.reviveState = false;
    //animation has 8 frames per row
    this.keyframes = [0,1,2,3,4,5,6,7];
    //rows of spritesheet
    this.south = 0;
    this.southeast = 1;
    this.east = 2;
    this.northeast = 3;
    this.north = 4;
    this.northwest = 5;
    this.west = 6;
    this.southwest = 7;
    this.death = 8;
    //set initial keyframe
    this.currentLoopIndex = 0;
    //set initial framecount
    this.frameCount = 0;
    this.frameLimit = 4;
    Skeleton.all.push(this);
  }
  get img() {
    let image = new Image();
    image.src = this.spritesheet;
    return image;
  }
  get width() {return this.rawWidth*SCALE;}
  get height() {return this.rawHeight*SCALE;}
  get z() {return this.y+this.height}
  get center() {return this.x+this.width/2}
  get xMax() {return this.x+this.width*0.7;}
  get yMax() {return this.y+this.height;}
  get xMin() {return this.x+this.width*0.3}
  get yMin() {return this.y+this.height*0.85;}
  get direction() {
    //switch row of spritesheet for proper direction
    switch (true) {
      case (this.deathState):
          return this.death;
      case (this.angle <= 22.5 && this.angle > -22.5):
          //east
          return this.east;
      case (this.angle <= 67.5 && this.angle > 22.5):
          //southeast
          return this.southeast;
      case (this.angle <= 112.5 && this.angle > 67.5): 
          //south
          return this.south;
      case (this.angle <= 157.5 && this.angle > 112.5):
          //southwest
          return this.southwest;
      case (this.angle <= -157.5 || this.angle > 157.5):
          //west
          return this.west;
      case (this.angle <= -112.5 && this.angle > -157.5):
          //northwest
          return this.northwest;
      case (this.angle <= -67.5 && this.angle > -112.5):
          //north
          return this.north;
      case (this.angle <= -22.5 && this.angle > -67.5):
          //northeast
          return this.northeast;
      default:
          return this.southeast;
    }
  }
  updateVectors() {
    //base movement off of offset character coordinates to center of head of character
    this.xD = mouseX - (this.x+(this.width/2));
    this.yD = mouseY - (this.y+(this.height/8));
    //get the angle of the mouse relative to the character
    this.angle = Math.atan2(this.yD, this.xD)*180/Math.PI;
    this.vector = Math.hypot(this.xD,this.yD);
  }
  
  move() {
    let deltaX = this.xD/this.vector
    let deltaY = this.yD/this.vector
    //movement
    // if (!this.collideX) {
      if (this.xMin + deltaX >= 0 && this.xMax + deltaX <= gameCanvas.width) {
          this.x += deltaX*this.speed*SCALE;
      }
    // }
    // if (!this.collideY) {
      if (this.yMin + deltaY >= 0 && this.yMax + deltaY <= gameCanvas.height) {
          this.y += deltaY*this.speed*SCALE;
      }
    // }
     //calling the angle math here adjusts character's movement even if mouse stops moving
     this.updateVectors();
  }

  unMoveX() {
    let deltaX = this.xD/this.vector
    //movement
      if (this.xMin + deltaX >= 0 && this.xMax + deltaX <= gameCanvas.width) {
          this.x -= deltaX*this.speed*SCALE;
      }
     //calling the angle math here adjusts character's movement even if mouse stops moving
     this.updateVectors();
  }

  unMoveY() {
    let deltaY = this.yD/this.vector
    //movement
      if (this.yMin + deltaY >= 0 && this.yMax + deltaY <= gameCanvas.height) {
          this.y -= deltaY*this.speed*SCALE;
      }
     //calling the angle math here adjusts character's movement even if mouse stops moving
     this.updateVectors();
  }

  animate() {
    //run animation
    if (this.moving) {
      this.move();
      this.frameCount++;
      if (this.frameCount >= this.frameLimit/this.speed) {
        this.frameCount = 0;
        this.currentLoopIndex++;
        if (this.currentLoopIndex >= this.keyframes.length) {
          this.currentLoopIndex = 0;
        }
      }
    }

    if (!this.moving) {
      if (this.deathState && !this.reviveState) {
        this.frameCount++;
        if (this.frameCount >= this.frameLimit/this.speed) {
          this.frameCount = 0;
          this.currentLoopIndex++;
          if (this.currentLoopIndex >= this.keyframes.length) {
            this.currentLoopIndex = 7;
          }
        }
      } else if (this.deathState && this.reviveState) {
        this.frameCount++;
        if (this.frameCount >= this.frameLimit/this.speed) {
          this.frameCount = 0;
          this.currentLoopIndex--;
          if (this.currentLoopIndex <= 0) {
            this.currentLoopIndex = 0;
            this.reviveState = false;
            this.deathState = false;
          }
        }
      } else {
        this.currentLoopIndex = 0;
      }
    }
  }
  
  changeState() {
    if (this.vector < this.width) {
      if (this.deathState) {
        this.reviveState = true;
      } else {
        this.deathState = true;
        this.currentLoopIndex = 0;
      }
    }
  }
  
  changeMoving() {
    //character stops when touching mouse
    switch(true) {
      case (this.vector <= this.width/4 || !mousePresent || this.deathState):
        this.moving = false;
        break;
      case (this.vector > this.width/4 && mousePresent):
        this.moving = true;
        break;
    }
  }
  
  drawFrame() {
    //Create collision circles to indicate when mouse is close enough to interact with clicking
    if (this.vector < this.width) {
      gameCtx.beginPath();
      gameCtx.arc(this.x+(this.width/2), this.y+(this.height/8), this.width, 0, 2 * Math.PI);
      gameCtx.fillStyle = "rgb(129, 176, 72, 0.5)";
      gameCtx.fill();
    }
    // if (this.vector < this.width/4) {
    //   gameCtx.beginPath();
    //   gameCtx.arc(this.x+(this.width/2), this.y+(this.height/8), this.width/4, 0, 2 * Math.PI);
    //   gameCtx.fillStyle = "rgb(87, 139, 40, 0.5)";
    //   gameCtx.fill();
    // }
    //draw a specific frame from the spritesheet
    gameCtx.drawImage(this.img,
                this.currentLoopIndex * this.rawWidth, this.direction * this.rawHeight, this.rawWidth, this.rawHeight,
                this.x, this.y, this.width, this.height);
  }
  
  draw() {
    let closeBoxes = [];

    function checkProximity(a,b) {
      return Math.hypot(a.center-b.center,a.z-b.z);
    }
    Box.all.forEach(b => {
      let d = checkProximity(this,b)
      if (d<60) {closeBoxes.push(b)} else {b.color = "black";}
    });
    closeBoxes.forEach(b => {
      collide(this, b)
    })
    // gameCtx.beginPath();
    // gameCtx.moveTo(this.center, this.z);
    // gameCtx.lineTo(closestBox.center, closestBox.z);
    // gameCtx.stroke();
    // collide(this,closestBox);

    this.animate();
    this.changeMoving();
    this.drawFrame();
  }
}

Skeleton.all = [];
Box.all = [];

let s = new Skeleton('https://i.imgur.com/fkkH3uL.png',32,32,0.5,0,0)
let wall = new Box(32,32,170,175)

//Listen for mouse movement
gameCanvas.addEventListener('mousemove', mouseMoveListener);
function mouseMoveListener(e) {
   //get mouse coordinates within the gameCanvas
   mouseX=e.offsetX;
   mouseY=e.offsetY;
   Skeleton.all.forEach(s => s.updateVectors());
}

//Listen for mouse presence
gameCanvas.addEventListener('mouseover', mouseOverListener)
function mouseOverListener(e) {
    mousePresent=true;
}
gameCanvas.addEventListener('mouseout', mouseOutListener)
function mouseOutListener(e) {
    mousePresent=false;
}

//Listen for clicking
gameCanvas.addEventListener('click', clickListener)
function clickListener(e) {
  Skeleton.all.forEach(s => s.changeState());
}

function compareZAxis(obj1,obj2) {
    if (obj1.z > obj2.z) {
        return 1;
    } else if (obj1.z === obj2.z) {
        if (obj1.center <= obj2.center) {
            return 1;
        } else {
            return -1;
        }
    } else {
        return -1;
    }
}

function drawObjects(array) {
    for (let i=0; i<array.length; i++) {
        array[i].draw();
    }
}

let objects = [s,wall];

function drawLoop() {
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    objects.sort(compareZAxis);
    drawObjects(objects);

    window.requestAnimationFrame(drawLoop);
}

window.requestAnimationFrame(drawLoop);

//---------------------------Generate the map-----------------------------//
let generateBtn = document.querySelector(".generate-btn")

generateBtn.addEventListener("click", generateMap);

function generateMap(e) {
  let imageData = offScreenCTX.getImageData(0,0,offScreenCVS.width,offScreenCVS.height);
  //reset objects on map
  objects = [];
  Skeleton.all = [];
  Box.all = [];
  //Iterate through pixels and make objects each time a color matches
  for (let i=0; i<imageData.data.length; i+=4) {
    let x = i/4%offScreenCVS.width, y = (i/4-x)/offScreenCVS.width;
    let color = `rgba(${imageData.data[i]}, ${imageData.data[i+1]}, ${imageData.data[i+2]}, ${imageData.data[i+3]})`
    switch(true) {
      case (color === "rgba(0, 0, 0, 255)"):
        //black pixel
        objects.push(new Box(40,40,x*40,y*40))
        break;
      case (color === "rgba(255, 255, 255, 255)"):
        //white pixel
        objects.push(new Skeleton('https://i.imgur.com/fkkH3uL.png',32,32,0.5,x*40-SCALE*16+20,y*40-SCALE*32+20));
        break;
      default: 
        //transparent pixel
    }
  }
}