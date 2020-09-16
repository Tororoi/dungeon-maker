class Viewport {
    constructor() {
        this.width = gameCanvas.width;
        this.height = gameCanvas.height;
    }

    get centerX() {return this.x+this.width/2;}
    get centerY() {return this.y+this.height/2;}
    get xMin() {
        if (Player.all[0]) {
            let viewLeft = Player.all[0].centerX-this.width/2;
            if (viewLeft < 0) {viewLeft = 0;}
            if (viewLeft > mapCanvas.width-this.width) {viewLeft = mapCanvas.width-this.width;}
            return viewLeft;
        }
        return 0;
    }
    get yMin() {
        if (Player.all[0]) {
            let viewUp = Player.all[0].centerY-this.height/2;
            if (viewUp < 0) {viewUp = 0;}
            if (viewUp > mapCanvas.height-this.height) {viewUp = mapCanvas.height-this.height;}
            return viewUp;
        }
        return 0;
    }
    get xMax() {return this.xMin+this.width;}
    get yMax() {return this.yMin+this.height;}
}