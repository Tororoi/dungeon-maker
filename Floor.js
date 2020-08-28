class Floor {
    constructor(rawWidth, rawHeight, x, y) {
      this.rawWidth = rawWidth;
      this.rawHeight = rawHeight;
      this.x = x;
      this.y = y;
      this.color = "gray";
      Floor.all.push(this);
    }

    get width() {return this.rawWidth*SCALE;}
    get height() {return this.rawHeight*SCALE;}
    get z() {return 0}
    get centerX() {return this.x+this.width/2}
    get centerY() {return this.y+this.width/2}
    get xMax() {return this.x+this.width;}
    get yMax() {return this.y+this.height;}
    get xMin() {return this.x;}
    get yMin() {return this.y;}
  
    draw() {
        gameCtx.fillStyle = this.color;
        gameCtx.fillRect(this.x, this.y,this.width, this.height);
        gameCtx.fillRect(this.x, this.y-this.height, this.width, this.height);
    }
  }
  