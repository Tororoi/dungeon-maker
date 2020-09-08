class Skeleton {
    constructor(rawWidth, rawHeight, speed, x, y) {
      this.spritesheet = './images/skeleton_spritesheet.png';
      this.img = new Image();
      this.img.src = this.spritesheet;
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
      this.pathXD = 0;
      this.pathYD = 0;
      this.pathAngle = 0;
      this.pathVector = 1;
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
      //set calc precision
      this.decPlace = 1000;
      this.cornerBuffer = true;
      //path target
      this.pathTarget = [32,32];
      Skeleton.all.push(this);
    }
    // get img() {
    //   let image = new Image();
    //   image.src = this.spritesheet;
    //   return image;
    // }
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

    get direction() {
      //switch row of spritesheet for proper direction
      switch (true) {
        case (this.deathState):
            return this.death;
        case (this.pathAngle <= 22.5 && this.pathAngle > -22.5):
            //east
            return this.east;
        case (this.pathAngle <= 67.5 && this.pathAngle > 22.5):
            //southeast
            return this.southeast;
        case (this.pathAngle <= 112.5 && this.pathAngle > 67.5): 
            //south
            return this.south;
        case (this.pathAngle <= 157.5 && this.pathAngle > 112.5):
            //southwest
            return this.southwest;
        case (this.pathAngle <= -157.5 || this.pathAngle > 157.5):
            //west
            return this.west;
        case (this.pathAngle <= -112.5 && this.pathAngle > -157.5):
            //northwest
            return this.northwest;
        case (this.pathAngle <= -67.5 && this.pathAngle > -112.5):
            //north
            return this.north;
        case (this.pathAngle <= -22.5 && this.pathAngle > -67.5):
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
      this.xD = this.target[0] - (this.centerX);
      this.yD = this.target[1] - (this.centerY);
      //get the angle of the mouse relative to the character
      this.angle = Math.atan2(this.yD, this.xD)*180/Math.PI;
      this.vector = Math.hypot(this.xD,this.yD);
      //base movement off of offset character coordinates to center of head of character
      this.pathXD = this.pathTarget[0] - (this.centerX);
      this.pathYD = this.pathTarget[1] - (this.centerY);
      //get the angle of the mouse relative to the character
      this.pathAngle = Math.atan2(this.pathYD, this.pathXD)*180/Math.PI;
      this.pathVector = Math.hypot(this.pathXD,this.pathYD);
    }

    //********* Calculate Cost ***********//
    //Calc path distance
    calcGCost(node) {
        let curr = node;
        let cost = 0;
        while(curr.parent) {
            let step = Math.floor(this.euclid(curr,curr.parent)*this.decPlace)/this.decPlace;
            cost += step;
            curr = curr.parent;   
        }
        cost = Math.floor(cost*this.decPlace)/this.decPlace;
        return cost;
    }
    //Calc heuristic distance (octile distance)
    calcHCost(currNode, endNode) {
        let a = Math.abs(currNode.x - endNode.x);
        let b = Math.abs(currNode.y - endNode.y);
        function leastSide() {
            if (a > b) {return b;} else {return a;}
        }
        let diagonalCost = leastSide()*Math.sqrt(2);
        let horizontalCost = Math.abs(b-a);
        let sum = diagonalCost+horizontalCost;
        return Math.floor(sum*this.decPlace)/this.decPlace;
    }
    //Euclidean Distance
    euclid(node1, node2) {
        let distance = Math.hypot(node1.x - node2.x,node1.y - node2.y);
        return Math.floor(distance*this.decPlace)/this.decPlace;
    }
    //Tie Breakers
    get tieBreak() {return this.noBreak};
    //Tiebreak with cross product to favor paths closer to a straight line to the goal
    crossBreak(currNode, startNode, endNode) {
        let dx1 = currNode.x - endNode.x;
        let dy1 = currNode.y - endNode.y;
        let dx2 = startNode.x - endNode.x;
        let dy2 = startNode.y - endNode.y;
        let cross = Math.abs(dx1*dy2 - dx2*dy1);
        let breaker = cross*(1/this.decPlace)
        return breaker;
    }
    //Prioritize closest to goal
    proximBreak(currNode, startNode, endNode) {
        //dwarf gCost
        let breaker = this.euclid(currNode, endNode)*(1/this.decPlace);
        return breaker;
    }
    //No Tie Break
    noBreak(currNode, startNode, endNode) {
        return 0;
    }
    //Calc fCost
    calcFCost(g, h) {
        return Math.floor((g + h)*this.decPlace)/this.decPlace;
    }
    //Rank by fCost, then hCost if equal.
    compareFCost(obj1,obj2) {
        if (obj1.fCost === obj2.fCost) {
            if (obj1.hCost > obj2.hCost) {
                return 1;
            } else {
                return -1;
            }
        } else if (obj1.fCost > obj2.fCost) {
            return 1;
        } else if (obj1.fCost < obj2.fCost) {
            return -1;
        }
        return 0;
    }

    makeGrid() {
        //Make the 2D array to hold all objects
        let self = this;
        let grid = [];
        for (let i=0; i<offScreenCVS.height; i++) {
            grid[i] = [];
            for (let j=0; j<offScreenCVS.width; j++) {
                let checkWalls = w => w.gridX===j&&w.gridY===i;
                let others = Skeleton.all.filter(s => s != self);
                if (Wall.all.some(checkWalls)) {
                    grid[i][j] = {parent: null, type: "wall", x: j, y: i, gCost: 0, hCost: 0, fCost: 0}
                } else if (others.some(checkWalls)) {
                    grid[i][j] = {parent: null, type: "wall", x: j, y: i, gCost: 0, hCost: 0, fCost: 0}
                } else {
                    grid[i][j] = {parent: null, type: "free", x: j, y: i, gCost: 0, hCost: 0, fCost: 0}
                }
            }
        }
        return grid;
    }

    findPath() {
        let self = this;
        let gameGrid = self.makeGrid();
        //A* pathfinding algorithm

        //Start
        let start = gameGrid[self.gridY][self.gridX];
        start.type = "start";
        //Goal
        let goalX = Math.floor(self.target[0]/32);
        let goalY = Math.floor(self.target[1]/32);
        //Account for edge of canvas
        if (goalY<0) {goalY = 0};
        if (goalY>9) {goalY = 9};
        if (goalX<0) {goalX = 0};
        if (goalX>15) {goalX = 15};

        let goal = gameGrid[goalY][goalX];
        if (goal.type === "wall") {
            self.moving = false;
            return [goal];
        }

        //Priority queue
        let open = new Set();
        open.add(start);
        start.gCost = 0;
        start.hCost = Math.floor((self.calcHCost(start, goal)+self.tieBreak(start))*self.decPlace)/self.decPlace;
        start.fCost = self.calcFCost(start.gCost, start.hCost);
        //empty set
        let closed = new Set();
        let current = start;

        while (open.size>0) {
            //Remove current from open and add it to closed
            open.delete(current);
            closed.add(current);

            //End case
            if (current === goal) {
                let curr = current;
                let tempPath = [];
                while(curr.parent) {
                    tempPath.push(curr);
                    curr = curr.parent;
                }
                // tempPath.push(curr);
                let truePath = tempPath.reverse();
                return truePath;
            }

            //Eight neighbors
            let neighbors = [];
            let east,west,south,north,northeast,northwest,southeast,southwest;
            if (gameGrid[current.y][current.x+1]) {
                //east
                east = gameGrid[current.y][current.x+1];
                neighbors.push(east);
            }
            if (gameGrid[current.y][current.x-1]) {
                //west
                west = gameGrid[current.y][current.x-1];
                neighbors.push(west);
            }
            if (gameGrid[current.y+1]) {
                //south
                south = gameGrid[current.y+1][current.x];
                neighbors.push(south);
                if (gameGrid[current.y+1][current.x-1]) {
                    //southwest
                    southwest = gameGrid[current.y+1][current.x-1];
                    neighbors.push(southwest);
                }
                if (gameGrid[current.y+1][current.x+1]) {
                    //southeast
                    southeast = gameGrid[current.y+1][current.x+1];
                    neighbors.push(southeast);
                }
            }
            if (gameGrid[current.y-1]) {
                //north
                north = gameGrid[current.y-1][current.x];
                neighbors.push(north);
                if (gameGrid[current.y-1][current.x-1]) {
                    //northwest
                    northwest = gameGrid[current.y-1][current.x-1];
                    neighbors.push(northwest);
                }
                if (gameGrid[current.y-1][current.x+1]) {
                    //northeast
                    northeast = gameGrid[current.y-1][current.x+1];
                    neighbors.push(northeast);
                }
            }
    
            for (let i=0; i<neighbors.length; i++) {
                let neighbor = neighbors[i];
                if (neighbor.type === "wall" || closed.has(neighbor)) {
                    continue;
                }
                //Check corners
                if (neighbor === northeast) {
                    if ((north.type === "wall")&&(east.type === "wall")) {
                        continue;
                    }
                    if (self.cornerBuffer) {
                        if ((east.type === "wall")) {
                            continue;
                        }
                        if ((north.type === "wall")) {
                            continue;
                        }
                    }
                    
                }
                if (neighbor === northwest) {
                    if ((north.type === "wall")&&(west.type === "wall")) {
                        continue;
                    }
                    if (self.cornerBuffer) {
                        if ((west.type === "wall")) {
                            continue;
                        }
                        if ((north.type === "wall")) {
                            continue;
                        }
                    }
                }
                if (neighbor === southeast) {
                    if ((south.type === "wall")&&(east.type === "wall")) {
                        continue;
                    }
                    if (self.cornerBuffer) {
                        if ((east.type === "wall")) {
                            continue;
                        }
                        if ((south.type === "wall")) {
                            continue;
                        }
                    }
                }
                if (neighbor === southwest) {
                    if ((south.type === "wall")&&(west.type === "wall")) {
                        continue;
                    }
                    if (self.cornerBuffer) {
                        if ((west.type === "wall")) {
                            continue;
                        }
                        if ((south.type === "wall")) {
                            continue;
                        }
                    }
                }
                let tCost = self.euclid(neighbor,current);
                //For new tiles
                if (!(open.has(neighbor)||closed.has(neighbor))) {
                    if (neighbor!=start) {neighbor.parent = current;}
                    open.add(neighbor);
                    //Round the costs to take care of floating point errors.
                    neighbor.gCost = self.calcGCost(neighbor);
                    neighbor.hCost = Math.floor((self.calcHCost(neighbor, goal) + self.tieBreak(neighbor, start, goal))*self.decPlace)/self.decPlace;
                    neighbor.fCost = self.calcFCost(neighbor.gCost, neighbor.hCost);
                } else if (open.has(neighbor)&&neighbor.gCost > current.gCost+tCost) {
                    if (neighbor!=start) {neighbor.parent = current;}
                    neighbor.gCost = self.calcGCost(neighbor);
                    neighbor.fCost = self.calcFCost(neighbor.gCost, neighbor.hCost);
                }
            }
            //make current lowest fCost
            let arr = [...open];
            arr.sort(self.compareFCost);
            current = arr[0];
        }
        //This makes skeletons stop moving if there's something blocking the path. Behavior should be to go to nearest available tile to the site of the blockage.
        self.moving = false;
        return [goal];
    }
    
    move() {
      let deltaX = this.pathXD/this.pathVector
      let deltaY = this.pathYD/this.pathVector
      //movement
        if (this.xMin + deltaX >= 0 && this.xMax + deltaX <= gameCanvas.width) {
            this.x += deltaX*this.speed*SCALE;
        }
        if (this.yMin + deltaY >= 0 && this.yMax + deltaY <= gameCanvas.height) {
            this.y += deltaY*this.speed*SCALE;
        }
       //calling the angle math here adjusts character's movement even if mouse stops moving
       this.updateVectors();
    }
  
    unMoveX() {
      let deltaX = this.pathXD/this.pathVector
      //movement
        if (this.xMin + deltaX >= 0 && this.xMax + deltaX <= gameCanvas.width) {
            this.x -= deltaX*this.speed*SCALE;
        }
       this.updateVectors();
    }
  
    unMoveY() {
      let deltaY = this.pathYD/this.pathVector
      //movement
        if (this.yMin + deltaY >= 0 && this.yMax + deltaY <= gameCanvas.height) {
            this.y -= deltaY*this.speed*SCALE;
        }
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
        case (this.vector <= this.width/2 || !mousePresent || this.deathState):
          this.moving = false;
          break;
        case (this.vector > this.width/2 && mousePresent):
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
      //draw a specific frame from the spritesheet
      gameCtx.drawImage(this.img,
                  this.currentLoopIndex * this.rawWidth, this.direction * this.rawHeight, this.rawWidth, this.rawHeight,
                  this.x, this.y, this.width, this.height);
    }
    
    draw() {
      let path = this.findPath();
    //   path.forEach(n => {
    //       gameCtx.fillStyle = "orange";
    //       gameCtx.fillRect(n.x*32,n.y*32,32,32);
    //   });
      if (path[0]) {
        // gameCtx.fillStyle = "yellow";
        // gameCtx.fillRect(path[0].x*32,path[0].y*32,32,32);
        this.pathTarget = [path[0].x*32+16,path[0].y*32+16]
      }
    //   Wall.all.forEach(b => {
    //     collide(this, b);
    //   })
    //   Skeleton.all.forEach(s => {
    //     collide(this,s);
    //   })
  
      this.animate();
      this.changeMoving();
      this.drawFrame();
    }
  }