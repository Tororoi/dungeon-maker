//set scale of sprite
let SCALE = 3;

//canvas
let canvas = document.querySelector('canvas');
let ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
//coordinates of mouse
let mouseX;
let mouseY;
//start with mouse outside of canvas
let mousePresent = false;

function collide(obj1,obj2) {
  // let collided = !(obj1.xMax<obj2.x || obj1.x>obj2.xMax || obj1.y>obj2.yMax || obj1.yMax<obj2.y);
  let insideW = !(obj1.xMax+Math.sign(obj1.xD)<obj2.x || obj1.x+Math.sign(obj1.xD)>obj2.xMax);
  let insideH = !(obj1.y+Math.sign(obj1.yD)>obj2.yMax || obj1.yMax+Math.sign(obj1.yD)<obj2.y);
  let outsideW = !(obj1.xMax-Math.sign(obj1.xD)<obj2.x || obj1.x-Math.sign(obj1.xD)>obj2.xMax);
  let outsideH = !(obj1.y-Math.sign(obj1.yD)>obj2.yMax || obj1.yMax-Math.sign(obj1.yD)<obj2.y);
  
  switch(true) {
    case (insideW&&!insideH):
      obj1.collideX = false;
      obj1.collideY = false;
      obj2.color = "red";
      break;
    case (!insideW&&insideH):
      obj1.collideX = false;
      obj1.collideY = false;
      obj2.color = "blue";
      break;
    case (insideW&&insideH&&!outsideW):
      obj1.collideX = true;
      obj2.color = "#4d00c7";
      break;
    case (insideW&&insideH&&!outsideH):
      obj1.collideY = true;
      obj2.color = "#c700a1";
      break;
    default: 
      obj1.collideX = false;
      obj1.collideY = false;
      obj2.color = "white";
  }
}

class Box {
  constructor(width, height, x, y) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.color = "white";
  }
  get xMax() {return this.x+this.width;}
  get yMax() {return this.y+this.height;}
  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y,this.width, this.height)
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
  }
  get img() {
    let image = new Image();
    image.src = this.spritesheet;
    return image;
  }
  get width() {return this.rawWidth*SCALE;}
  get height() {return this.rawHeight*SCALE;}
  get xMax() {return this.x+this.width;}
  get yMax() {return this.y+this.height;}
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
    if (!this.collideX) {
      if (this.x + deltaX >= 0 && this.x + this.width + deltaX <= canvas.width) {
          this.x += deltaX*this.speed*SCALE;
      }
    }
    if (!this.collideY) {
      if (this.y + deltaY >= 0 && this.y + this.height + deltaY <= canvas.height) {
          this.y += deltaY*this.speed*SCALE;
      }
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
  
  draw() {
    //Create collision circles to indicate when mouse is close enough to interact with clicking
    if (this.vector < this.width) {
      ctx.beginPath();
      ctx.arc(this.x+(this.width/2), this.y+(this.height/8), this.width, 0, 2 * Math.PI);
      ctx.fillStyle = "rgb(129, 176, 72, 0.5)";
      ctx.fill();
    }
    if (this.vector < this.width/4) {
      ctx.beginPath();
      ctx.arc(this.x+(this.width/2), this.y+(this.height/8), this.width/4, 0, 2 * Math.PI);
      ctx.fillStyle = "rgb(87, 139, 40, 0.5)";
      ctx.fill();
    }
    //draw a specific frame from the spritesheet
    ctx.drawImage(this.img,
                this.currentLoopIndex * this.rawWidth, this.direction * this.rawHeight, this.rawWidth, this.rawHeight,
                this.x, this.y, this.width, this.height);
  }
  
  runAnimation() {
    collide(this, wall)
    this.animate();
    this.changeMoving();
    this.draw();
  }
}

let s = new Skeleton('https://i.imgur.com/fkkH3uL.png',32,32,0.5,0,0)
let wall = new Box(300,50,170,175)

//Listen for mouse movement
canvas.addEventListener('mousemove', mouseMoveListener);
function mouseMoveListener(e) {
   //get mouse coordinates within the canvas
   mouseX=e.offsetX;
   mouseY=e.offsetY;
   s.updateVectors();
}

//Listen for mouse presence
canvas.addEventListener('mouseover', mouseOverListener)
function mouseOverListener(e) {
    mousePresent=true;
}
canvas.addEventListener('mouseout', mouseOutListener)
function mouseOutListener(e) {
    mousePresent=false;
}

//Listen for clicking
canvas.addEventListener('click', clickListener)
function clickListener(e) {
    s.changeState();
}

function drawLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    //Draw wall
    wall.draw();
    //Draw Skeletons
    s.runAnimation();

    window.requestAnimationFrame(drawLoop);
}

window.requestAnimationFrame(drawLoop);