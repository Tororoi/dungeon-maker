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
      this.currentTile = [x*32,y*32];
      this.previousTile = [x*32,y*32];
      this.pathTarget = [32,32];
      Skeleton.all.push(this);
    }
    get img() {
      let image = new Image();
      image.src = this.spritesheet;
      return image;
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
        if (!!mouseX) {
            return [mouseX, mouseY];
        } else {
            return [32,32];
        }
    }

    updateVectors() {
      //base movement off of offset character coordinates to center of head of character
      this.xD = this.pathTarget[0] - (this.centerX);
      this.yD = this.pathTarget[1] - (this.centerY);
      //get the angle of the mouse relative to the character
      this.angle = Math.atan2(this.yD, this.xD)*180/Math.PI;
      this.vector = Math.hypot(this.xD,this.yD);
    }

    findPath() {
        //A* pathfinding algorithm
        //Make the 2D array to hold all objects
        let gameGrid = [];
        for (let i=0; i<offScreenCVS.height; i++) {
            gameGrid[i] = [];
            for (let j=0; j<offScreenCVS.width; j++) {
                let checkWalls = w => w.gridX===j&&w.gridY===i;
                if (Wall.all.some(checkWalls)) {
                    gameGrid[i][j] = {parent: null, type: "wall", x: j, y: i, gCost: 0, hCost: 0, fCost: 0}
                } else {
                    gameGrid[i][j] = {parent: null, type: "free", x: j, y: i, gCost: 0, hCost: 0, fCost: 0}
                }
            }
        }
        //Start
        let gridX = Math.floor(this.centerX/32);
        let gridY = Math.floor(this.centerY/32);
        let start = gameGrid[gridY][gridX];
        //Goal
        let goalX = Math.floor(this.target[0]/32);
        let goalY = Math.floor(this.target[1]/32);
        let goal = gameGrid[goalY][goalX];
        //Set current Tile
        if (this.currentTile != start) {
            this.previousTile = this.currentTile;
            this.currentTile = start;
        }
        //Search
        //calculate cost
        function getDistance(x1,y1,x2,y2) {
            return Math.hypot(x1-x2,y1-y2);
        }
        //Priority queue
        let open = new Set();
        open.add(start);
        start.gCost = 0;
        start.hCost = getDistance(start.x,start.y,goal.x,goal.y);
        start.fCost = start.gCost+start.hCost;
        //empty set
        let closed = new Set();
        let stop = 0
        while (open.size>0&&stop<30) {
            stop+=1;
            console.log(stop,open)
            //Get lowest fCost for processing
            //Grab open Node with lowest fCost to process next
            function compareFCost(obj1,obj2) {
                if (obj1.fCost > obj2.fCost) {
                    return 1;
                } else {
                    return -1;
                }
            } 

            let openArr = Array.from(open);
            openArr.sort(compareFCost)
            open.forEach(n => {
                gameCtx.fillStyle = "green";
                gameCtx.fillRect(n.x*32,n.y*32,32,32);
            });
            let current = openArr[0];
            gameCtx.fillStyle = "purple";
            gameCtx.fillRect(current.x*32,current.y*32,32,32);
            closed.forEach(n => {
                gameCtx.fillStyle = "blue";
                gameCtx.fillRect(n.x*32,n.y*32,32,32);
            })
            console.log("current",current)
            //Remove lowest fCost from open and add it to closed
            open.delete(current);
            closed.add(current);
            //End case
            if (current === goal) {
                let curr = current;
                let path = [];
                let n = 0;
                while(curr.parent&&n<30) {
                    path.push(curr);
                    curr = curr.parent;
                    n+=1;
                }
                console.log("yay!", path)
                return path.reverse();
                // setTimeout(function(){ alert("Hello"); }, 1000000);
                // console.log(path.reverse())
                // return path.reverse();
            }
            //Eight neighbors
            let neighbors = [];
            if (gameGrid[current.y][current.x+1]) {
                //east
                neighbors.push(gameGrid[current.y][current.x+1]);
            }
            if (gameGrid[current.y][current.x-1]) {
                //west
                neighbors.push(gameGrid[current.y][current.x-1]);
            }
            if (gameGrid[current.y+1]) {
                //south
                neighbors.push(gameGrid[current.y+1][current.x]);
                if (gameGrid[current.y+1][current.x-1]) {
                    //southwest
                    neighbors.push(gameGrid[current.y+1][current.x-1]);
                }
                if (gameGrid[current.y+1][current.x+1]) {
                    //southeast
                    neighbors.push(gameGrid[current.y+1][current.x+1]);
                }
            }
            if (gameGrid[current.y-1]) {
                //north
                neighbors.push(gameGrid[current.y-1][current.x]);
                if (gameGrid[current.y-1][current.x-1]) {
                    //northwest
                    neighbors.push(gameGrid[current.y-1][current.x-1]);
                }
                if (gameGrid[current.y-1][current.x+1]) {
                    //northeast
                    neighbors.push(gameGrid[current.y-1][current.x+1]);
                }
            }

            let cost = current.hCost;

            for (let i=0; i<neighbors.length; i++) {
                let neighbor = neighbors[i];
                if (neighbor.type != "free"||closed.has(neighbor)) {
                    continue;
                }
                neighbor.gCost = getDistance(neighbor.x,neighbor.y,start.x,start.y);
                neighbor.hCost = getDistance(neighbor.x,neighbor.y,goal.x,goal.y);
                neighbor.fCost = neighbor.gCost+neighbor.hCost;
                if (open.has(neighbor)&&neighbor.hCost > cost) {
                    open.delete(neighbor);
                    closed.add(neighbor);
                }
                if (open.has(neighbor)&&neighbor.hCost < cost) {
                    open.delete(neighbor);
                }
                if (closed.has(neighbor)&&neighbor.hCost < cost) {
                    closed.delete(neighbor);
                }
                if (!(open.has(neighbor)&&closed.has(neighbor))) {
                    if (!neighbor.parent&&neighbor!=start) {neighbor.parent = current;}
                    cost = neighbor.hCost;
                    open.add(neighbor);
                }
            }
        }
        load();
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
    //    this.findPath();
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
        //   this.moving = false;
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
      let path = this.findPath()
      path.forEach(n => {
          gameCtx.fillStyle = "orange";
          gameCtx.fillRect(n.x*32,n.y*32,32,32);
      });
      gameCtx.fillStyle = "yellow";
      gameCtx.fillRect(path[0].x*32,path[0].y*32,32,32);
      this.pathTarget = [path[0].x*32+16,path[0].y*32+16]
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