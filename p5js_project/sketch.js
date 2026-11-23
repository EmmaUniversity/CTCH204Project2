
// -<>- OBJECTS -<>-

const playerFoot = {
    isFacingR: true,
    isFront: true,
    frame: 0,
    position:null //for the sake of correct pixel placement, this position is in pixels instead of tiles
}

const objPlayer = {
    position: null,
    size: null, //used for collision
    velocity: null,
    
    selectedTile: null,
    isSelectValid: false,

    isFacingR: true,

    animFeet: null,

    init: function(pos) {
        this.position = createVector(pos.x, pos.y);
        this.size = createVector(1, 1);
        this.velocity = createVector(0, 0);

        this.selectedTile = createVector(0, 0);

        //animation
        this.animFeet = [];
        let foot = Object.create(playerFoot);
        foot.position = createVector(pos.x*16, pos.y*16)
        this.animFeet.push(foot);

        foot = Object.create(playerFoot);
        foot.position = createVector(pos.x*16, pos.y*16);
        foot.isFront = false;
        this.animFeet.push(foot);
    },

    step: function() {
        if (ended) {
            //when you enter the final room
            this.position.x -= 0.1;
            return;
        }
        
        //restarts every frame as long as you're holding r which is janky, but I don't think causes any actual problems
        if (keyIsDown('r')) {
            restartLevel();

            for (let i = 0; i < this.animFeet.length; i++) {
                let foot = this.animFeet[i];
                foot.position.x = this.position.x*16;
                foot.position.y = this.position.y*16;
            }
        }


        //movement
        //TODO: implement angel frames
        //horizontal movement
        let hKey = keyIsDown('d')-keyIsDown('a');
        this.velocity.x = hKey * 0.1;

        //vertical movement
        //using w because I can't be bothered to figure out the key code for space
        let isGroundedPreMovement = objIsGrounded(this);
        if (keyIsDown('w')) {
            //need a proper isGrounded function
            if (isGroundedPreMovement) {
                this.velocity.y = -0.425;
            }
        }

        //push the player upward if they're at the bottom of a vertical level transition
        if ((floor(this.position.y) <= currentLevel.y) && (this.velocity.y < 0)) {
            this.velocity.y = -0.5;
        }
        this.velocity.y = max(-0.5, this.velocity.y+0.025);

        //execute the movement
        //if current tool is hammer, the player needs to be able to pass through spikes so they can collide with them
        if (tool == 1) {
            this.velocity = moveAndSlide(this, this.velocity, ["nailPoint"]);
        } else {
            this.velocity = moveAndSlide(this, this.velocity);
        }


        //levels
        //try to load another level if player steps out of the current one
        let center = this.position.copy();
        center.x += this.size.x/2
        center.y += this.size.y/2
        
        if ((center.x < currentLevel.x) || (center.x >= currentLevel.x+currentLevel.w) || (center.y < currentLevel.y) || (center.y > currentLevel.y+currentLevel.h)) {
            let nextLevels = currentLevel.connectedLevels;
            for (let i = 0; i < nextLevels.length; i++) {
                let connectedLevelIndex = levelNames.get(nextLevels[i])
                let connectedLevel = levels[connectedLevelIndex];
                if ((center.x >= connectedLevel.x) && (center.x < connectedLevel.x+connectedLevel.w) && (center.y >= connectedLevel.y) && (center.y < connectedLevel.y+connectedLevel.h)) {
                    loadLevel(connectedLevelIndex);
                    break;
                }
            }
        }


        //tile selection
        if (keyIsDown('w')) {
            //upward selection
            this.selectedTile.x = floor(this.position.x+0.5)-currentLevel.x;
            this.selectedTile.y = floor((this.position.y)-1)-currentLevel.y;
        } else if (keyIsDown('s')) {
            //downward selection
            this.selectedTile.x = floor(this.position.x+0.5)-currentLevel.x;
            this.selectedTile.y = floor((this.position.y+2.99)-1)-currentLevel.y;
        } else {
            //horizontal selection
            this.selectedTile.x = floor((this.position.x+this.isFacingR*2.99)-1)-currentLevel.x;
            this.selectedTile.y = floor(this.position.y+0.5)-currentLevel.y;
        }

        this.isSelectValid = false;
        switch (tool) {
            case 0:
                //no tool

                break;

            case 1:
                //hammer
                if ((this.selectedTile.x >= 1) && (this.selectedTile.x < currentLevel.w-1)) {
                    if ((this.selectedTile.y >= 1) && (this.selectedTile.y < currentLevel.h-1)) {
                        if (tileMeta[this.selectedTile.x][this.selectedTile.y] != null) {
                            for (let i = 0; i < tileMeta[this.selectedTile.x][this.selectedTile.y].length; i++) {
                                let meta = tileMeta[this.selectedTile.x][this.selectedTile.y][i];

                                if (meta.type == "nailHead") {
                                    this.isSelectValid = true;
                                    break;
                                }

                            }

                        }

                    }
                }

                break;
        }


        //ability
        if (keyIsDown("Shift")) {
            switch (tool) {
                case 0:
                    //no tool

                    break;
                
                case 1:
                    //hammer
                    if (this.isSelectValid) {
                        let nailDirection = null;
                        
                        for (let i = 0; i < tileMeta[this.selectedTile.x][this.selectedTile.y].length; i++) {
                            let meta = tileMeta[this.selectedTile.x][this.selectedTile.y][i];

                            if (meta.type == "nailHead") {
                                nailDirection = meta.direction;
                            } 
                        }

                        hammerTile(createVector(this.selectedTile.x, this.selectedTile.y), nailDirection);
                    }
            
            }
        }


        //animation
        if (hKey != 0) {
            if (hKey == 1) {
                this.isFacingR = true;
            } else {
                this.isFacingR = false;
            }
        }

        if (objIsGrounded(this)) {
            if ((hKey != 0)) {
                //WALKING ANIMATION
                let footTargetX = ((this.position.x+0.5)*16)+((-0.5+(1*this.isFacingR))*16)
                let farthestFoot = 0;
                let footDistance = 100000;
                for (let i = 0; i < this.animFeet.length; i++) {
                    let foot = this.animFeet[i];
                    foot.position.y = (this.position.y*16)+(this.size.y*16)
                    foot.frame = 0;

                    let distance = abs(foot.position.x-footTargetX);
                    if (distance < footDistance) {
                        footDistance = distance
                    } else {
                        farthestFoot = i;
                    }
                }

                if (footDistance > 12) {
                    let foot = this.animFeet[farthestFoot];
                    foot.position.x = footTargetX;
                    foot.isFacingR = this.isFacingR; 
                }

            } else {
                //IDLE ANIMATION
                for (let i = 0; i < this.animFeet.length; i++) {
                    let foot = this.animFeet[i];
                    foot.isFacingR = this.isFacingR;
                    foot.frame = 0;

                    foot.position.y = (this.position.y*16)+(this.size.y*16)
                    let footTargetX = (((this.position.x+0.5)*16)-4)+(i*8)-((-0.5+(1*this.isFacingR))*8)
                    let diference = footTargetX-foot.position.x
                    foot.position.x += min(1, abs(diference))*Math.sign(diference);
                }
            }

        } else {
            //AIR ANIMATION
            for (let i = 0; i < this.animFeet.length; i++) {
                let foot = this.animFeet[i];
                foot.isFacingR = this.isFacingR;
                foot.position.y = (this.position.y*16)+(this.size.y*16)-(this.velocity.y*16)
                let footTargetX = (((this.position.x+0.5)*16)-3)+(i*6)-((-0.5+(1*this.isFacingR))*map(this.velocity.y, -0.5, 0.5, 18, 4))
                foot.position.x = footTargetX;

                if (this.velocity.y < 0.1) {
                    foot.frame = 2;
                } else if (this.velocity.y < 0.3) {
                    foot.frame = 0;
                } else {
                    foot.frame = 1;
                }
            }
        }
    },

    draw: function() {
        if (this.isFacingR) {
            viewport.image(imgPlayer, this.position.x*16, this.position.y*16, 16, 16, 0, 0, 16, 16);
        } else {
            viewport.image(imgPlayer, this.position.x*16, this.position.y*16, 16, 16, 16, 0, 16, 16);
        }

        for (let i = 0; i < this.animFeet.length; i++) {
            let foot = this.animFeet[i];
            viewport.image(imgPlayer, foot.position.x-(8*!foot.isFacingR), foot.position.y-8, 8, 8, 0+(8*!foot.isFacingR)+(foot.frame*16), 16+(8*foot.isFront), 8, 8);
        }

        if (this.isSelectValid) {
            viewport.image(imgSelection, (this.selectedTile.x+currentLevel.x)*16, (this.selectedTile.y+currentLevel.y)*16);
        }
    }
}



//sprites
let imgTiles;
let imgPlayer;
let imgFogs = [];
let imgSelection;

//level variables
const level = {
    id: 0,
    name: "",
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    restartPosition: null,
    connectedLevels: [],
    tiles: [],
    title: ""
}

let levels = [];
let levelNames;
let currentLevel;
let currentLevelId = -1;

let tileMeta = null;
let tiles = null;

let objects = [];

// 0 = none
// 1 = hammer
// 2 = paintbrush
let tool = 0;

let ended = false; //set to true when the you've beat the game
let endingLevel = 13; //hard coding this because I don't need anything more complicated

let cameraPosition;

//level transition animation
let cameraPositionOld;
let transitionAnimationTick = 1;
let oldLevelPosition;
let oldLevelSize;

//for the sake of resizing the canvas
const scale = window.devicePixelRatio
const canvasWidth = 32*18;
const canvasHeight = 32*18;
const pixelSize = 2;

let viewport;
let canvasElement;
let titleElement;



// -<>- SETUP -<>-

async function setup() {
    //rescale the canvas so that it displays at 1 unit = 1 screen pixel
    // css pixels do not necessarily equal physical pixels
    // which means that any pixel art will get akwardly rescaled when drawn to the screen.
    createCanvas(canvasWidth, canvasHeight);
    canvasElement = document.getElementById("defaultCanvas0");
    canvasElement.setAttribute('style', 'width: ' + str(canvasWidth/scale) + 'px; height: ' + str(canvasHeight/scale) + 'px;')

    //level title setup
    //https://stackoverflow.com/questions/46558733/how-to-add-a-h1-inside-a-div-using-javascript
    titleElement = document.createElement('H1');
    titleElement.id = "levelTitle";
    titleElement.innerHTML = "Loading...";
    document.body.appendChild(titleElement);

    //load levels from json
    await loadLevels();

    //set up camera variables
    viewport = createGraphics(canvasWidth/pixelSize, canvasHeight/pixelSize)
    cameraPosition = createVector(-1, -1);
    cameraPositionOld = createVector(-1, -1);
    
    //load images
    imgTiles = await loadImage("p5js_project/assets/tiles.png");
    imgPlayer = await loadImage("p5js_project/assets/player2.png");
    imgFogs = [await(loadImage("p5js_project/assets/fog_e.png")), 
               await(loadImage("p5js_project/assets/fog_n.png")), 
               await(loadImage("p5js_project/assets/fog_w.png")), 
               await(loadImage("p5js_project/assets/fog_s.png"))];
    imgSelection = await loadImage("p5js_project/assets/selection.png");

    //load inital level and player object
    loadLevel(0);
    instantiateObject(objPlayer, createVector(7, 4));

    //resize canvas element
    canvasElement.setAttribute('style', 'width: ' + str(canvasWidth/scale) + 'px; height: ' + str(canvasHeight/scale) + 'px;')
}



// -<>- LEVELS -<>-

async function loadLevels() {
    let levelsJson = await loadJSON("p5js_project/levels.ldtk");
    levelNames = new Map;

    for (let i = 0; i < levelsJson.levels.length; i++) {
        let json = levelsJson.levels[i];
        let thisLevel = Object.create(level); //naming this weird because of the way I named the tempalte object ;-;
        
        //level properties
        thisLevel.id = i;
        thisLevel.name = json.iid;
        thisLevel.x = json.worldX/16;
        thisLevel.y = json.worldY/16;
        thisLevel.w = json.pxWid/16;
        thisLevel.h = json.pxHei/16;

        //level contents
        thisLevel.tiles = []; //without this, all levels reference the same tiles array
        for (let i = 0; i < json.layerInstances.length; i++) {
            let layer = json.layerInstances[i];
            if (layer.__identifier == "Collision") {
                //tiles

                for (let x = 0; x < thisLevel.w; x++) {
                    let row = []
                    thisLevel.tiles.push(row)
                    for (let y = 0; y < thisLevel.h; y++) {
                        //using json.layerInstances[1] here might cause an issue
                        row.push(layer.intGridCsv[(y*thisLevel.w)+x])
                    }
                }

            } else if (layer.__identifier == "Entities"){
                //level restart positions
                //maybe this should have been a field instead of an entity?

                for (let j = 0; j < layer.entityInstances.length; j++) {
                    let entity = layer.entityInstances[j];

                    if (entity.__identifier == "PlayerStart") {
                        thisLevel.restartPosition = createVector(entity.__worldX/16, entity.__worldY/16);
                    }
                }
            }
        }

        //level connections
        thisLevel.connectedLevels = [];
        for (let i = 0; i < json.__neighbours.length; i++) {
            let connection = json.__neighbours[i];
            thisLevel.connectedLevels.push(connection.levelIid);
        }

        //level title
        for (let i = 0; i < json.fieldInstances.length; i++) {
            let fieldInstance = json.fieldInstances[i];
            if (fieldInstance.__identifier == "Title") {
                thisLevel.title = fieldInstance.__value;
            }
        }

        //add level to arrays
        levels.push(thisLevel);
        levelNames.set(json.iid, i);
    }
}

function loadLevel(index) {
    if (currentLevelId != -1) {
        oldLevelPosition = createVector(currentLevel.x, currentLevel.y);
        oldLevelSize = createVector(currentLevel.w, currentLevel.h);
        transitionAnimationTick = 0;
    }

    if (index == endingLevel) {
        ended = true;
    }

    currentLevelId = index;
    currentLevel = levels[index];
    titleElement.innerHTML = currentLevel.title;

    //setup tiles and tile meta 2d arrays
    tileMeta = [];
    tiles = [];
    for (let x = 0; x < currentLevel.w; x++) {
        tileMeta.push([]);
        tiles.push([]);
        for (let y = 0; y < currentLevel.h; y++) {
            tileMeta[x].push(null);
            tiles[x].push(currentLevel.tiles[x][y]);
        }
    }
    setupTileMeta(createVector(1, 1), createVector(currentLevel.w-2, currentLevel.h-2));

    let center = createVector(currentLevel.x+(currentLevel.w/2), currentLevel.y+(currentLevel.h/2));
    
    cameraPositionOld = cameraPosition.copy();
    cameraPosition.x = center.x-(viewport.width/32)
    cameraPosition.y = center.y-(viewport.height/32)

}

//currently every level has only a single reset position, which is a problem since some levels have multiple entrances
//  this can result in sequence breaking. A better appraoch, if I had the time, would be a checkpoint system where your
//  reset position is set to the first checkpoint you reach after entering a level
function restartLevel() {
    //reset tiles
    tileMeta = [];
    tiles = [];
    for (let x = 0; x < currentLevel.w; x++) {
        tileMeta.push([]);
        tiles.push([]);
        for (let y = 0; y < currentLevel.h; y++) {
            tileMeta[x].push(null);
            tiles[x].push(currentLevel.tiles[x][y]);
        }
    }
    setupTileMeta(createVector(1, 1), createVector(currentLevel.w-2, currentLevel.h-2));

    //move player
    let playerObject = objects[0] //assuming the player is the first object could cause problems if I keep working on this object, but for now, it's probably fine
    playerObject.position.x = currentLevel.restartPosition.x;
    playerObject.position.y = currentLevel.restartPosition.y;
}

//arguments define the rect within the tile map that get calculated
function setupTileMeta(postion, size) {

    //set up nail heads
    for (let y = postion.y; y < postion.y+size.y; y++) {
        for (let x = postion.x; x < postion.x+size.x; x++) {
            if (tiles[x][y] == 1) {
                //orthogonal neighbours in counterclockwise order
                let neighbours = [];
                neighbours.push(tiles[x+1][y]);
                neighbours.push(tiles[x][y-1]);
                neighbours.push(tiles[x-1][y]);
                neighbours.push(tiles[x][y+1]);

                //direction towards "point" of nail
                let vector = null;
                if        ((neighbours[0] == 1) && (neighbours[1] == 0) && (neighbours[2] == 0) && (neighbours[3] == 0)) {
                    vector = createVector(1, 0)
                } else if ((neighbours[0] == 0) && (neighbours[1] == 1) && (neighbours[2] == 0) && (neighbours[3] == 0)) {
                    vector = createVector(0, -1)
                } else if ((neighbours[0] == 0) && (neighbours[1] == 0) && (neighbours[2] == 1) && (neighbours[3] == 0)) {
                    vector = createVector(-1, 0)
                } else if ((neighbours[0] == 0) && (neighbours[1] == 0) && (neighbours[2] == 0) && (neighbours[3] == 1)) {
                    vector = createVector(0, 1)
                }

                //print(neighbours)
                if (vector != null) {
                    let meta = {
                        type: "nailHead",
                        direction: vector 
                    }
                    //putting it in an array because in future tiles might need to have multiple types of metadata
                    tileMeta[x][y] = [meta];
                }
            }
        }
    }

}

//x coordinates in tile space not world space
function shiftTilesRow(spanStart, spanEnd, y, direction) {
    if (direction == 1) {
        //hammer right
        
        for (let x = spanEnd; x >= spanStart; x--) {
            tiles[x+1][y] = tiles[x][y];
            tileMeta[x+1][y] = tileMeta[x][y];
        }
        tiles[spanStart][y] = 0;
        tileMeta[spanStart][y] = null;

        if ((tiles[spanStart+1][y+1] == 1) || (tiles[spanStart+1][y-1] == 1)) {
            tileMeta[spanStart+1][y] = null;
        }

        //nail point
        if (spandEnd+1 != currentLevel.w) {
            if (tiles[spanEnd+2][y] == 0) {
                let meta = {
                    type: "nailPoint",
                    direction: createVector(-direction, 0)
                }
                tileMeta[spanEnd+1][y] = [meta];
            } else {
                tileMeta[spanEnd+1][y] = null;
            }
        }

    } else {
        //hammer left

        for (let x = spanStart; x <= spanEnd; x++) {
            tiles[x-1][y] = tiles[x][y];
            tileMeta[x-1][y] = tileMeta[x][y];
        }
        tiles[spanEnd][y] = 0;
        tileMeta[spanEnd][y] = null;

        if ((tiles[spanEnd-1][y+1] == 1) || (tiles[spanEnd-1][y-1] == 1)) {
            tileMeta[spanEnd-1][y] = null;
        }

        //nail point
        if (spanStart-1 != 0) {
            if (tiles[spanStart-2][y] == 0) {
                let meta = {
                    type: "nailPoint",
                    direction: createVector(-direction, 0)
                }
                tileMeta[spanStart-1][y] = [meta];
            } else {
                tileMeta[spanStart-1][y] = null;
            }
        }
    }

}

function shiftTilesColumn(spanStart, spanEnd, x, direction) {
    if (direction == 1) {
        //hammer down
        
        for (let y = spanEnd; y >= spanStart; y--) {
            tiles[x][y+1] = tiles[x][y];
            tileMeta[x][y+1] = tileMeta[x][y];
        }
        tiles[x][spanStart] = 0;
        tileMeta[x][spanStart] = null;

        if ((tiles[x+1][spanStart+1] == 1) || (tiles[x-1][spanStart+1] == 1)) {
            tileMeta[x][spanStart+1] = null;
        }

        //nail point
        if (spanEnd+1 != currentLevel.h) {
            if (tiles[x][spanEnd+2] == 0) {
                let meta = {
                    type: "nailPoint",
                    direction: createVector(0, -direction) 
                }
                tileMeta[x][spanEnd+1] = [meta];
            } else {
                tileMeta[x][spanEnd+1] = null;
            }
        }

    } else {
        //hammer up

        for (let y = spanStart; y <= spanEnd; y++) {
            tiles[x][y-1] = tiles[x][y];
            tileMeta[x][y-1] = tileMeta[x][y];
        }
        tiles[x][spanEnd] = 0;
        tileMeta[x][spanEnd] = null;

        if ((tiles[x+1][spanEnd-1] == 1) || (tiles[x-1][spanEnd-1] == 1)) {
            tileMeta[x][spanEnd-1] = null;
        }

        //nail point
        if (spanStart-1 != 0) {
            if (tiles[x][spanStart-2] == 0) {
                let meta = {
                    type: "nailPoint",
                    direction: createVector(0, -direction) 
                }
                tileMeta[x][spanStart-1] = [meta];
            } else {
                tileMeta[x][spanStart-1] = null;
            }
        }

    }

}



// -<>- OBJECT MANGEMENT -<>-

function instantiateObject(objPrototype, position) { //maybe misuing the word prototype here, idk
    let obj = Object.create(objPrototype);
    obj.init(position);
    objects.push(obj);
}



// -<>- GAME LOGIC -<>-

//this whole function is pretty ugly and repetitive, but I'm not sure what the cleaner what to do it is
//mask is meta data types that collision will ignore
function moveAndSlide(obj, velocity, mask=[]) {
    //technically I could just let moveAndSlide update the object's actual velocity,
    //and maybe this would save a couple lines of code, but this feels safer
    let vel = velocity.copy();

    //X
    let rowSpan = createVector(max(floor(obj.position.y-currentLevel.y), 0), 
                               min(floor((obj.position.y+(obj.size.y-0.000001))-currentLevel.y), currentLevel.h-1));
    
    //set checking point, if traveling right, use position + width, if traveling left, just use position
    let intendedX; 
    if (velocity.x > 0) {
        intendedX = obj.position.x+vel.x+(obj.size.x-0.000001);
    } else {
        intendedX = obj.position.x+vel.x;
    }

    //index into the tiles matrix
    let truncatedX = floor(intendedX-currentLevel.x);

    //check for any collisions
    if ((truncatedX < currentLevel.w) && (truncatedX >= 0)) {
        for (let i = rowSpan.x; i <= rowSpan.y; i++) {
            if (tiles[truncatedX][i] == 1) {
                
                let masked = false; //if the tile has a meta data item which is included in the masked types
                if (tileMeta[truncatedX][i] != null) {
                    for (let j = 0; j < tileMeta[truncatedX][i].length; j++) {
                        if (mask.includes(tileMeta[truncatedX][i][j].type)) {
                            masked = true;
                        }
                    }
                }

                if (!masked) {
                    vel.x = 0;
                    break;
                }
            }
        }
    }

    //update position
    if (vel.x == velocity.x) {
        obj.position.x += vel.x;
    } else {
        if (velocity.x > 0) {
            obj.position.x = (truncatedX+currentLevel.x)-obj.size.x;
        } else {
            obj.position.x = truncatedX+currentLevel.x+1;
        }
    }


    //Y
    let columnSpan = createVector(max(floor(obj.position.x-currentLevel.x), 0), 
                                  min(floor((obj.position.x+(obj.size.x-0.000001))-currentLevel.x), currentLevel.w-1));

    let intendedY;
    if (velocity.y > 0) {
        intendedY = obj.position.y+vel.y+(obj.size.y-0.000001);
    } else {
        intendedY = obj.position.y+vel.y;
    }

    let truncatedY = floor(intendedY-currentLevel.y);

    if ((truncatedY < currentLevel.h) == (truncatedY >= 0)) {
        for (let i = columnSpan.x; i <= columnSpan.y; i++) {
            if (tiles[i][truncatedY] == 1) {
                
                let masked = false; //if the tile has a meta data item which is included in the masked types
                if (tileMeta[i][truncatedY] != null) {
                    for (let j = 0; j < tileMeta[i][truncatedY].length; j++) {
                        if (mask.includes(tileMeta[i][truncatedY][j].type)) {
                            masked = true;
                        }
                    }
                }

                if (!masked) {
                    vel.y = 0;
                    break;
                }
            }
        }
    }

    if (vel.y == velocity.y) {
        obj.position.y += vel.y;
    } else {
        if (velocity.y > 0) {
            obj.position.y = (truncatedY+currentLevel.y)-obj.size.y;
        } else {
            obj.position.y = truncatedY+currentLevel.y+1;
        }
    }

    return vel;
}

function objIsGrounded(obj) {
    //based on the moveAndSlide function, except it checks inclusive of the obj's vertical extent rather than up to it
    let columnSpan = createVector(max(floor(obj.position.x-currentLevel.x), 0), 
                                  min(floor((obj.position.x+(obj.size.x-0.000001))-currentLevel.x), currentLevel.w-1));

    let intendedY = obj.position.y+obj.velocity.y+(obj.size.y);
    let truncatedY = floor(intendedY-currentLevel.y);

    if ((truncatedY < currentLevel.h) == (truncatedY >= 0)) {
        for (let i = columnSpan.x; i <= columnSpan.y; i++) {
            if (tiles[i][truncatedY] == 1) {
                return true;
            }
        }
    }

    return false;
}

function hammerTile(position, vector) {
    
    if (vector.x != 0) {
        //horizontal nails
        let spanStart = position.x;
        let spanEnd = position.x;

        for (let x = position.x; (x < currentLevel.w-1) && (x > 0); x += vector.x) {
            if (tiles[x][position.y] != 0) {
                //little verbose to save myself from having to write this for loop once for each direction
                spanStart = min(spanStart, x);
                spanEnd = max(spanEnd, x);
            } else {
                break;
            }
        }

        shiftTilesRow(spanStart, spanEnd, position.y, vector.x);

    }

    if (vector.y != 0) {
        //vertical nails
        let spanStart = position.y;
        let spanEnd = position.y;

        for (let y = position.y; (y < currentLevel.h-1) && (y > 0); y += vector.y) {
            if (tiles[position.x][y] != 0) {
                //little verbose to save myself from having to write this for loop once for each direction
                spanStart = min(spanStart, y);
                spanEnd = max(spanEnd, y);
            } else {
                break;
            }
        }

        shiftTilesColumn(spanStart, spanEnd, position.x, vector.y);
    }

}



// -<>- DRAW -<>-

function draw() {
    //set tools
    if (keyIsDown('1')) {
        tool = 1;
    } else {
        tool = 0;
    }

    //object logic
    for (let i = 0; i < objects.length; i++) {
        objects[i].step();
    }

    //draw setup
    viewport.noSmooth();
    viewport.noStroke();
    viewport.pixelDensity(1);
    viewport.background(255);
    
    //camera animation
    //maps 0 to 1 on a linear curve to 0 to 1 on a cos curve where 0 is PI and 1 is 0/2PI
    let smoothTransition = (-cos(transitionAnimationTick*PI)/2)+0.5
    let currentCamera = createVector((lerp(cameraPositionOld.x, cameraPosition.x, smoothTransition)),
                                     (lerp(cameraPositionOld.y, cameraPosition.y, smoothTransition)));
    viewport.translate(-currentCamera.x*16, -currentCamera.y*16); 

    transitionAnimationTick = min(transitionAnimationTick+0.025, 1);

    viewport.fill(220);
    viewport.rect(currentLevel.x*16, currentLevel.y*16, currentLevel.w*16, currentLevel.h*16)

    //draw tiles
    for (let y = 0; y < currentLevel.h; y++) {
        for (let x = 0; x < currentLevel.w; x++) {
            if (tiles[x][y] == 1) {
                //pixel coordinates onto the tile map
                let tileX = 0
                let tileY = 0
                
                if (tool == 1) {
                    if (tileMeta[x][y] != null) {
                        for (let i = 0; i < tileMeta[x][y].length; i++) {
                            let meta = tileMeta[x][y][i];

                            if (meta.type == "nailHead") {
                                tileY += 16;
                                if (meta.direction.y != 0) {
                                    tileX += 16;
                                }
                                if ((meta.direction.y == -1) || (meta.direction.x == 1)) {
                                    tileY += 16;
                                }
                            } else if (meta.type == "nailPoint") {
                                tileY += 48;
                                if (meta.direction.y != 0) {
                                    tileX += 16;
                                }
                                if ((meta.direction.y == -1) || (meta.direction.x == 1)) {
                                    tileY += 16;
                                }
                            }
                        }
                    }
                }
                
                viewport.image(imgTiles, (x+currentLevel.x)*16, (y+currentLevel.y)*16, 16, 16, tileX, tileY, 16, 16);
            }
        }
    }

    //draw objects
    for (let i = 0; i < objects.length; i++) {
        objects[i].draw();
    }

    //fog
    viewport.image(imgFogs[1], currentLevel.x*16, currentLevel.y*16, currentLevel.w*16, 16);
    viewport.image(imgFogs[3], currentLevel.x*16, (currentLevel.y+currentLevel.h-1)*16, currentLevel.w*16, 16);

    viewport.image(imgFogs[2], currentLevel.x*16, currentLevel.y*16, 16, currentLevel.h*16);
    viewport.image(imgFogs[0], (currentLevel.x+currentLevel.w-1)*16, currentLevel.y*16, 16, currentLevel.h*16);

    //borders to hide out of bounds objects and fix flickering on level edges when camera moves
    //bugged when a room's bound match the size of the screen because the rectangles have 0 width/height and don't draw
    
    if (!ended) {
        viewport.fill(255);
        viewport.rect(currentCamera.x*16, currentCamera.y*16, viewport.width, ((currentLevel.y-currentCamera.y)*16)+1)
        viewport.rect(currentCamera.x*16, ((currentLevel.y+currentLevel.h)*16)-1, viewport.width, (((currentCamera.y+(viewport.height/16))-(currentLevel.y+currentLevel.h))*16)+2)
        viewport.rect(currentCamera.x*16, currentCamera.y*16, ((currentLevel.x-currentCamera.x)*16)+1, viewport.height);
        viewport.rect(((currentLevel.x+currentLevel.w)*16)-1, currentCamera.y*16, (((currentCamera.x+(viewport.width/16))-(currentLevel.x+currentLevel.w))*16)+2, viewport.height);
    } else {
        //when you enter the final room, don't let the fog follow you
        viewport.fill(255);
        viewport.rect(currentCamera.x*16, currentCamera.y*16, viewport.width, ((oldLevelPosition.y-currentCamera.y)*16)+1)
        viewport.rect(currentCamera.x*16, ((oldLevelPosition.y+oldLevelSize.h)*16)-1, viewport.width, (((currentCamera.y+(viewport.height/16))-(oldLevelPosition.y+oldLevelSize.h))*16)+2)
        viewport.rect(currentCamera.x*16, currentCamera.y*16, ((oldLevelPosition.x-currentCamera.x)*16)+1, viewport.height);
        viewport.rect(((oldLevelPosition.x+oldLevelSize.w)*16)-1, currentCamera.y*16, (((currentCamera.x+(viewport.width/16))-(oldLevelPosition.x+oldLevelSize.w))*16)+2, viewport.height);
    }

    if (transitionAnimationTick < 1) {
        viewport.fill(255-(max(lerp(80, 0, transitionAnimationTick*2), 0)));
        viewport.rect((oldLevelPosition.x+1)*16, (oldLevelPosition.y+1)*16, (oldLevelSize.x-2)*16, (oldLevelSize.y-2)*16);
    }

    //reset
    viewport.resetMatrix();

    //draw game to canvas
    pixelDensity(1);
    noSmooth();
    image(viewport, 0, 0, canvasWidth, canvasHeight);
    //one of these draw functions tries to resize the canvas
    //so I repeat this every frame as a bandaid fix
    canvasElement.setAttribute('style', 'width: ' + str(canvasWidth/scale) + 'px; height: ' + str(canvasHeight/scale) + 'px;');

}
