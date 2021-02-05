class Player {
    constructor(rawWidth, rawHeight, speed, x, y) {
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
      //collision
      this.horC = false;
      this.verC = false;
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

    move() {
        //equalize deltas to keep same speed at any angle
        let deltaX = this.xD/this.vector;
        let deltaY = this.yD/this.vector;
        //movement
        if (this.vector != 0) {
            this.x += deltaX*this.speed*SCALE;
            this.y += deltaY*this.speed*SCALE;
            //colliding
            if (this.xMin < 0 || this.xMax > mapCanvas.width || this.horC) {
                this.x -= deltaX*this.speed*SCALE;
            }
            if (this.yMin < 0 || this.yMax > mapCanvas.height || this.verC) {
                this.y -= deltaY*this.speed*SCALE;
            }
        }
        //calling the angle math here adjusts character's movement even if mouse stops moving
        this.updateVectors();
        Skeleton.all.forEach(s => s.updateVectors());
    }
    
    draw() {
        let collisions = [];
        Wall.all.forEach(b => {
            collisions.push(collide(this, b));
        })
        Skeleton.all.forEach(s => {
            collisions.push(collide(this,s));
        })
        if (collisions.some(c => c[0] === true)) {this.horC = true} else {this.horC = false};
        if (collisions.some(c => c[1] === true)) {this.verC = true} else {this.verC = false};
        this.move();
        mapCtx.fillStyle = "orange";
        mapCtx.fillRect(this.gridX*tileSize,this.gridY*tileSize,tileSize,tileSize);
        mapCtx.fillStyle = "green";
        mapCtx.fillRect(this.xMin,this.yMin,this.xMax-this.xMin,this.yMax-this.yMin);
    }
  }