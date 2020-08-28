class Wall {
    constructor(rawWidth, rawHeight, x, y) {
      this.spritesheet = './images/walls_spritesheet.png';
      this.rawWidth = rawWidth;
      this.rawHeight = rawHeight;
      this.x = x;
      this.y = y;
      this.spriteMatrix = [0,0,0,0];
      Wall.all.push(this);
    }
    get img() {
      let image = new Image();
      image.src = this.spritesheet;
      return image;
    }
    get width() {return this.rawWidth*SCALE;}
    get height() {return this.rawHeight*SCALE;}
    get z() {return this.y+this.height*0.75}
    get center() {return this.x+this.width/2}
    get xMax() {return this.x+this.width;}
    get yMax() {return this.y+this.height;}
    get xMin() {return this.x;}
    get yMin() {return this.y;}
    //Convert the matrix to a binary string and convert it to an integer
    get spriteCode() {return parseInt(this.spriteMatrix.join(""), 2);}
    get spriteX() {return this.spriteCode % 4;}
    get spriteY() {return Math.floor(this.spriteCode/4);}
  
    updateMatrix(obj1, obj2) {   
      //spritesheet is organized in binary 
      let right = !!(obj1.center<obj2.center);
      let left = !!(obj1.center>obj2.center);
      let down = !!(obj1.z<obj2.z);
      let up = !!(obj1.z>obj2.z);
  
      if (right) {this.spriteMatrix[0] = 1}
      if (left) (this.spriteMatrix[1] = 1)
      if (down) {this.spriteMatrix[2] = 1}
      if (up) (this.spriteMatrix[3] = 1)
    }
  
    findNeighbors() {
      let neighbors = [];
  
      function checkProximity(a,b) {
        return Math.hypot(a.center-b.center,a.z-b.z);
      }
      Wall.all.forEach(w => {
        let d = checkProximity(this,w)
        if (d<this.width+1) {neighbors.push(w)}
      });
      neighbors.forEach(w => {
        this.updateMatrix(this, w);
      })
    }
  
    draw() {
      gameCtx.drawImage(this.img,
        this.spriteX * this.rawWidth, this.spriteY * this.rawHeight * 2, this.rawWidth, this.rawHeight * 2,
        this.x, this.y-this.height, this.width, this.height * 2);
    }
  }
  