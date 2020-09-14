//set scale of sprites
let SCALE = 2;
let tileSize = 16*SCALE;

//-----------------------------Map Generator Canvas------------------------------//
//Set onscreen canvas and its context
let onScreenCVS = document.querySelector(".generator");
let onScreenCTX = onScreenCVS.getContext("2d");

//Create an offscreen canvas. This is where we will actually be drawing, 
//in order to keep the image consistent and free of distortions.
let offScreenCVS = document.createElement('canvas');
let offScreenCTX = offScreenCVS.getContext("2d");

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

//We only want the mouse to move if the mouse is down, so we need a 
//variable to disable drawing while the mouse is not clicked.
let clicked = false;

function handleMouseMove(e) {
    if (clicked) {
        draw(e)
        generateMap();
    }
}

function handleMouseDown(e) {
    clicked = true;
    draw(e);
    generateMap();
}

function handleMouseUp() {
    clicked = false;
}

//Helper functions

//Draw a single pixel on the canvas. Get the ratio of the difference in 
//size of the on and offscreen canvases to calculate where to draw on the 
//offscreen canvas based on the coordinates of clicking on the onscreen canvas.
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

//----------------------------Pathfinding---------------------------------//
//set calc precision
let decPlace = 1000;
let cornerBuffer = true;
//********* Calculate Cost ***********//
//Calc path distance
function calcGCost(node) {
    let curr = node;
    let cost = 0;
    while(curr.parent) {
        let step = Math.floor(euclid(curr,curr.parent)*decPlace)/decPlace;
        cost += step;
        curr = curr.parent;   
    }
    cost = Math.floor(cost*decPlace)/decPlace;
    return cost;
}
//Calc heuristic distance (octile distance)
function calcHCost(currNode, endNode) {
    let a = Math.abs(currNode.x - endNode.x);
    let b = Math.abs(currNode.y - endNode.y);
    function leastSide() {
        if (a > b) {return b;} else {return a;}
    }
    let diagonalCost = leastSide()*Math.sqrt(2);
    let horizontalCost = Math.abs(b-a);
    let sum = diagonalCost+horizontalCost;
    return Math.floor(sum*decPlace)/decPlace;
}
//Euclidean Distance
function euclid(node1, node2) {
    let distance = Math.hypot(node1.x - node2.x,node1.y - node2.y);
    return Math.floor(distance*decPlace)/decPlace;
}
//Tie Breakers
function tieBreak() {noBreak()};
//Tiebreak with cross product to favor paths closer to a straight line to the goal
function crossBreak(currNode, startNode, endNode) {
    let dx1 = currNode.x - endNode.x;
    let dy1 = currNode.y - endNode.y;
    let dx2 = startNode.x - endNode.x;
    let dy2 = startNode.y - endNode.y;
    let cross = Math.abs(dx1*dy2 - dx2*dy1);
    let breaker = cross*(1/decPlace)
    return breaker;
}
//Prioritize closest to goal
function proximBreak(currNode, startNode, endNode) {
    //dwarf gCost
    let breaker = euclid(currNode, endNode)*(1/decPlace);
    return breaker;
}
//No Tie Break
function noBreak(currNode, startNode, endNode) {
    return 0;
}
//Calc fCost
function calcFCost(g, h) {
    return Math.floor((g + h)*decPlace)/decPlace;
}
//Rank by fCost, then hCost if equal.
function compareFCost(obj1,obj2) {
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


//---------------------------Running the game-----------------------------//

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
  
  let leftOf2 = !!(obj1.centerX<obj2.centerX);
  let rightOf2 = !!(obj1.centerX>obj2.centerX);
  let upOf2 = !!(obj1.centerY<obj2.centerY);
  let downOf2 = !!(obj1.centerY>obj2.centerY);

  let checkEast = !!((obj1.xMax+Math.sign(obj1.xD) >= obj2.xMin)&&yOverlap&&leftOf2);
  let checkWest = !!((obj1.xMin+Math.sign(obj1.xD) <= obj2.xMax)&&yOverlap&&rightOf2);
  let checkSouth = !!((obj1.yMax+Math.sign(obj1.yD) >= obj2.yMin)&&xOverlap&&upOf2);
  let checkNorth = !!((obj1.yMin+Math.sign(obj1.yD) <= obj2.yMax)&&xOverlap&&downOf2);

  if (checkEast||checkWest) {
    obj1.unMoveX();
  }

  if (checkSouth||checkNorth) {
    obj1.unMoveY();
  }
}

Skeleton.all = [];
Wall.all = [];

let s = new Skeleton(32,32,0.5,0,0);
let wall = new Wall(16,16,170,175);

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
        if (obj1.centerX <= obj2.centerX) {
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

let objects = [];

function drawLoop() {
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    //Draw Cursor
    gameCtx.fillStyle = "red";
    gameCtx.fillRect(Math.floor(mouseX/tileSize)*tileSize,Math.floor(mouseY/tileSize)*tileSize,tileSize,tileSize);

    objects.sort(compareZAxis);
    drawObjects(objects);

    window.requestAnimationFrame(drawLoop);
}

window.requestAnimationFrame(drawLoop);

//---------------------------Generate the map-----------------------------//
let generateBtn = document.querySelector(".generate-btn")

generateBtn.addEventListener("click", generateMap);

//Define the empty 2D Array
// let gameGrid = [];

function generateMap(e) {
  let imageData = offScreenCTX.getImageData(0,0,offScreenCVS.width,offScreenCVS.height);
  //reset objects on map
  objects = [];
  Skeleton.all = [];
  Wall.all = [];
  //Iterate through pixels and make objects each time a color matches
  for (let i=0; i<imageData.data.length; i+=4) {
    let x = i/4%offScreenCVS.width, y = (i/4-x)/offScreenCVS.width;
    let color = `rgba(${imageData.data[i]}, ${imageData.data[i+1]}, ${imageData.data[i+2]}, ${imageData.data[i+3]})`
    switch(true) {
      case (color === "rgba(0, 0, 0, 255)"):
        //black pixel
        objects.push(new Wall(16,16,x*tileSize,y*tileSize,x,y));
        break;
      case (color === "rgba(255, 255, 255, 255)"):
        //white pixel
        objects.push(new Skeleton(32,32,0.5,x*tileSize-tileSize+(tileSize/2),y*tileSize-SCALE*tileSize+(tileSize/2)));
        break;
      default: 
        //transparent pixel
    }
  }
  //Set the sprite for each wall upon generation.
  Wall.all.forEach(w => {
    w.findNeighbors();
  })
}