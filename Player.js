class Player {
    constructor(rawWidth, rawHeight, speed, x, y) {
    //   this.spritesheet = './images/skeleton_spritesheet.png';
    //   this.img = new Image();
    //   this.img.src = this.spritesheet;
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
    //   this.pathXD = 0;
    //   this.pathYD = 0;
    //   this.pathAngle = 0;
    //   this.pathVector = 1;
    //   //collisions
    //   this.collideX = false;
    //   this.collideY = false;
    //   //state
    //   this.moving = false;
    //   this.deathState = false;
    //   this.reviveState = false;
    //   //animation has 8 frames per row
    //   this.keyframes = [0,1,2,3,4,5,6,7];
    //   //rows of spritesheet
    //   this.south = 0;
    //   this.southeast = 1;
    //   this.east = 2;
    //   this.northeast = 3;
    //   this.north = 4;
    //   this.northwest = 5;
    //   this.west = 6;
    //   this.southwest = 7;
    //   this.death = 8;
    //   //set initial keyframe
    //   this.currentLoopIndex = 0;
    //   //set initial framecount
    //   this.frameCount = 0;
    //   this.frameLimit = 4;
    //   //path target
    //   this.pathTarget = [0,0];
    Player.all.push(this);
    }

    get width() {return this.rawWidth*SCALE;}
    get height() {return this.rawHeight*SCALE;}
    get centerX() {return this.x+this.width/2;}
    get centerY() {return this.y+this.height;}
    get z() {return this.centerY;}
    get xMax() {return this.x+this.width*0.7;}
    get yMax() {return this.y+this.height;}
    get xMin() {return this.x+this.width*0.3}
    get yMin() {return this.y+this.height*0.85;}
    get gridX() {return Math.floor(this.centerX/32);}
    get gridY() {return Math.floor(this.centerY/32);}

    // get direction() {
    //   //switch row of spritesheet for proper direction
    //   switch (true) {
    //     case (this.deathState):
    //         return this.death;
    //     case (this.pathAngle <= 22.5 && this.pathAngle > -22.5):
    //         //east
    //         return this.east;
    //     case (this.pathAngle <= 67.5 && this.pathAngle > 22.5):
    //         //southeast
    //         return this.southeast;
    //     case (this.pathAngle <= 112.5 && this.pathAngle > 67.5): 
    //         //south
    //         return this.south;
    //     case (this.pathAngle <= 157.5 && this.pathAngle > 112.5):
    //         //southwest
    //         return this.southwest;
    //     case (this.pathAngle <= -157.5 || this.pathAngle > 157.5):
    //         //west
    //         return this.west;
    //     case (this.pathAngle <= -112.5 && this.pathAngle > -157.5):
    //         //northwest
    //         return this.northwest;
    //     case (this.pathAngle <= -67.5 && this.pathAngle > -112.5):
    //         //north
    //         return this.north;
    //     case (this.pathAngle <= -22.5 && this.pathAngle > -67.5):
    //         //northeast
    //         return this.northeast;
    //     default:
    //         return this.southeast;
    //   }
    // }

    get target() {
        let coords = [this.centerX,this.centerY];
        if (buttonMap.left && this.xMin>0) {
            // left arrow
            coords[0] -= 1;
            if (coords[0] < this.centerX-1) {coords[0] = this.centerX-1}
        } 
        if (buttonMap.up && this.yMin>0) {
            // up arrow
            coords[1] -= 1;
            if (coords[1] < this.centerY-1) {coords[1] = this.centerY-1}
        }
        if (buttonMap.right && this.xMax<mapCanvas.width) {
            // right arrow
            coords[0] += 1;
            if (coords[0] > this.centerX+1) {coords[0] = this.centerX+1}
        }
        if (buttonMap.down && this.yMax<mapCanvas.height) {
            // down arrow
            coords[1] += 1;
            if (coords[1] < this.centerY+1) {coords[1] = this.centerY+1}
        }
        return coords;
    }

    updateVectors() {
      //base movement off of offset character coordinates to center of feet of character
      this.xD = this.target[0] - (this.centerX);
      this.yD = this.target[1] - (this.centerY);
      //get the angle of the mouse relative to the character
      this.angle = Math.atan2(this.yD, this.xD)*180/Math.PI;
      this.vector = Math.hypot(this.xD,this.yD);
    }

    // move() {
    //     if (buttonMap.left && this.xMin>0) {
    //         // left arrow
    //         this.moveX(-1*this.speed);
    //     } 
    //     if (buttonMap.up && this.yMin>0) {
    //         // up arrow
    //         this.moveY(-1*this.speed);
    //     }
    //     if (buttonMap.right && this.xMax<mapCanvas.width) {
    //         // right arrow
    //         this.moveX(this.speed);
    //     }
    //     if (buttonMap.down && this.yMax<mapCanvas.height) {
    //         // down arrow
    //         this.moveY(this.speed);
    //     }
    // }

    // moveX(dir) {
    //     this.x += dir;
    //     Skeleton.all.forEach(s => s.updateVectors());
    // }

    // moveY(dir) {
    //     this.y += dir;
    //     Skeleton.all.forEach(s => s.updateVectors());
    // }

    // unMoveX() {
    //     if (buttonMap.left && this.xMin>0) {
    //         // left arrow
    //         this.moveX(this.speed);
    //       } 
    //     if (buttonMap.right && this.xMax<mapCanvas.width) {
    //         // right arrow
    //         this.moveX(-1*this.speed);
    //       }
    // }

    // unMoveY() {
    //     if (buttonMap.up && this.yMin>0) {
    //         // up arrow
    //         this.moveY(this.speed);
    //     }
    //     if (buttonMap.down && this.yMax<mapCanvas.height) {
    //         // down arrow
    //         this.moveY(-1*this.speed);
    //     }
    // }

    move() {
      let deltaX = this.xD/this.vector
      let deltaY = this.yD/this.vector
      //movement
        if (this.xMin + deltaX >= 0 && this.xMax + deltaX <= mapCanvas.width) {
            this.x += deltaX*this.speed*SCALE;
        }
        if (this.yMin + deltaY >= 0 && this.yMax + deltaY <= mapCanvas.height) {
            this.y += deltaY*this.speed*SCALE;
        }
       //calling the angle math here adjusts character's movement even if mouse stops moving
       this.updateVectors();
       Skeleton.all.forEach(s => s.updateVectors());
    }
  
    unMoveX() {
      let deltaX = this.xD/this.vector
      //movement
        if (this.xMin + deltaX >= 0 && this.xMax + deltaX <= mapCanvas.width) {
            this.x -= deltaX*this.speed*SCALE;
        }
       this.updateVectors();
    }
  
    unMoveY() {
      let deltaY = this.yD/this.vector
      //movement
        if (this.yMin + deltaY >= 0 && this.yMax + deltaY <= mapCanvas.height) {
            this.y -= deltaY*this.speed*SCALE;
        }
       this.updateVectors();
    }
  
    // animate() {
    //   //run animation
    //   if (this.moving) {
    //     this.move();
    //     this.frameCount++;
    //     if (this.frameCount >= this.frameLimit/this.speed) {
    //       this.frameCount = 0;
    //       this.currentLoopIndex++;
    //       if (this.currentLoopIndex >= this.keyframes.length) {
    //         this.currentLoopIndex = 0;
    //       }
    //     }
    //   }
  
    //   if (!this.moving) {
    //     if (this.deathState && !this.reviveState) {
    //       this.frameCount++;
    //       if (this.frameCount >= this.frameLimit/this.speed) {
    //         this.frameCount = 0;
    //         this.currentLoopIndex++;
    //         if (this.currentLoopIndex >= this.keyframes.length) {
    //           this.currentLoopIndex = 7;
    //         }
    //       }
    //     } else if (this.deathState && this.reviveState) {
    //       this.frameCount++;
    //       if (this.frameCount >= this.frameLimit/this.speed) {
    //         this.frameCount = 0;
    //         this.currentLoopIndex--;
    //         if (this.currentLoopIndex <= 0) {
    //           this.currentLoopIndex = 0;
    //           this.reviveState = false;
    //           this.deathState = false;
    //         }
    //       }
    //     } else {
    //       this.currentLoopIndex = 0;
    //     }
    //   }
    // }
    
    // changeState() {
    //   if (this.vector < this.width) {
    //     if (this.deathState) {
    //       this.reviveState = true;
    //     } else {
    //       this.deathState = true;
    //       this.currentLoopIndex = 0;
    //     }
    //   }
    // }
    
    // changeMoving() {
    //   //character stops when touching mouse
    //   switch(true) {
    //     case (this.vector <= this.width/2 || !mousePresent || this.deathState):
    //       this.moving = false;
    //       break;
    //     case (this.vector > this.width/2 && mousePresent):
    //       this.moving = true;
    //       break;
    //   }
    // }
    
    // drawFrame() {
    //   //Create collision circles to indicate when mouse is close enough to interact with clicking
    //   if (this.vector < this.width) {
    //     mapCtx.beginPath();
    //     mapCtx.arc(this.centerX, this.centerY, this.width, 0, 2 * Math.PI);
    //     mapCtx.strokeStyle = "rgb(255,255,0,0.5)";
    //     mapCtx.stroke();
    //   }
    //   //draw a specific frame from the spritesheet
    //   mapCtx.drawImage(this.img,
    //               this.currentLoopIndex * this.rawWidth, this.direction * this.rawHeight, this.rawWidth, this.rawHeight,
    //               this.x, this.y, this.width, this.height);
    // }
    
    draw() {
      Wall.all.forEach(b => {
        collide(this, b);
      })
    //   Skeleton.all.forEach(s => {
    //     collide(this,s);
    //   })
    this.move();
    mapCtx.fillStyle = "orange";
    mapCtx.fillRect(this.gridX*tileSize,this.gridY*tileSize,tileSize,tileSize);
    mapCtx.fillStyle = "green";
    mapCtx.fillRect(this.xMin,this.yMin,this.xMax-this.xMin,this.yMax-this.yMin);
    //   this.animate();
    //   this.changeMoving();
    //   this.drawFrame();
    }
  }