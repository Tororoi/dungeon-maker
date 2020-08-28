class Skeleton {
    constructor(rawWidth, rawHeight, speed, x, y) {
      this.spritesheet = './images/skeleton_spritesheet.png';
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

    get target() {
        return [mouseX, mouseY]
    }

    updateVectors() {
      //base movement off of offset character coordinates to center of head of character
      this.xD = this.target[0] - (this.x+(this.width/2));
      this.yD = this.target[1] - (this.y+(this.height/8));
      //get the angle of the mouse relative to the character
      this.angle = Math.atan2(this.yD, this.xD)*180/Math.PI;
      this.vector = Math.hypot(this.xD,this.yD);
    }

    function findPath(target) {
        // let 
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
        gameCtx.strokeStyle = "rgb(255,255,0,0.5)";
        gameCtx.stroke();
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
      // let closeWalles = [];
  
      // function checkProximity(a,b) {
      //   return Math.hypot(a.center-b.center,a.z-b.z);
      // }
      // Wall.all.forEach(b => {
      //   let d = checkProximity(this,b)
      //   if (d<60) {closeWalles.push(b)} else {b.color = "black";}
      // });
      // closeWalles.forEach(b => {
      //   collide(this, b);
      // })
      // gameCtx.beginPath();
      // gameCtx.moveTo(this.center, this.z);
      // gameCtx.lineTo(closestWall.center, closestWall.z);
      // gameCtx.stroke();
      // collide(this,closestWall);
      Wall.all.forEach(b => {
        collide(this, b);
      })
      Skeleton.all.forEach(s => {
        collide(this,s);
      })
  
      this.animate();
      this.changeMoving();
      this.drawFrame();
    }
  }