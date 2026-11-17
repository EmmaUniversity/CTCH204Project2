//for the sake of resizing the canvas
const scale = window.devicePixelRatio
const canvasWidth = 32*18;
const canvasHeight = 32*18;
const pixelSize = 2;

let viewport;
let canvasElement;
let titleElement;

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
    
    isFacingR: true,

    animFeet: null,

    init: function(pos) {
        this.position = createVector(pos.x, pos.y);
        this.size = createVector(1, 1);
        this.velocity = createVector(0, 0)

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
        this.velocity = moveAndSlide(this, this.velocity);


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
    }
}



const level = {
    id: 0,
    name: "",
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    connectedLevels: [],
    tiles: [],
    title: ""
}

let imgTiles;
let imgPlayer;
let imgFogs = [];

let levels = [];
let levelNames;
let currentLevel;
let currentLevelId = -1;

let objects = [];

let cameraPosition;


//level transition animation
let cameraPositionOld;
let transitionAnimationTick = 1;
let oldLevelPosition;
let oldLevelSize;

async function setup() {
    //rescale the canvas so that it displays at 1 unit = 1 screen pixel
    // css pixels do not necessarily equal physical pixels
    // which means that any pixel art will get akwardly rescaled when drawn to the screen.
    createCanvas(canvasWidth, canvasHeight);
    canvasElement = document.getElementById("defaultCanvas0");
    canvasElement.setAttribute('style', 'width: ' + str(canvasWidth/scale) + 'px; height: ' + str(canvasHeight/scale) + 'px;')
    //titleElement = document.getElementsByClassName("levelTitle");
    //https://stackoverflow.com/questions/46558733/how-to-add-a-h1-inside-a-div-using-javascript

    titleElement = document.createElement('H1');
    titleElement.id = "levelTitle";
    titleElement.innerHTML = "Loading...";
    document.body.appendChild(titleElement);

    await loadLevels();

    viewport = createGraphics(canvasWidth/pixelSize, canvasHeight/pixelSize)
    cameraPosition = createVector(-1, -1);
    cameraPositionOld = createVector(-1, -1);
    
    imgTiles = await loadImage("p5js_project/assets/tiles.png");
    imgPlayer = await loadImage("p5js_project/assets/player2.png");
    imgFogs = [await(loadImage("p5js_project/assets/fog_e.png")), 
               await(loadImage("p5js_project/assets/fog_n.png")), 
               await(loadImage("p5js_project/assets/fog_w.png")), 
               await(loadImage("p5js_project/assets/fog_s.png"))];

    loadLevel(0);
    instantiateObject(objPlayer, createVector(7, 4));

    canvasElement.setAttribute('style', 'width: ' + str(canvasWidth/scale) + 'px; height: ' + str(canvasHeight/scale) + 'px;')
}



async function loadLevels() {
    let levelsJson = await loadJSON("p5js_project/levels.ldtk");
    levelNames = new Map;

    for (let i = 0; i < levelsJson.levels.length; i++) {
        let json = levelsJson.levels[i];
        let thisLevel = Object.create(level); //naming this weird because of the way I named the tempalte object ;-;
        
        thisLevel.id = i;
        thisLevel.name = json.iid;
        thisLevel.x = json.worldX/16;
        thisLevel.y = json.worldY/16;
        thisLevel.w = json.pxWid/16;
        thisLevel.h = json.pxHei/16;

        thisLevel.tiles = []; //without this, all levels reference the same tiles array
        for (let x = 0; x < thisLevel.w; x++) {
            let row = []
            thisLevel.tiles.push(row)
            for (let y = 0; y < thisLevel.h; y++) {
                row.push(json.layerInstances[1].intGridCsv[(y*thisLevel.w)+x])
            }
        }

        thisLevel.connectedLevels = [];
        for (let i = 0; i < json.__neighbours.length; i++) {
            let connection = json.__neighbours[i];
            thisLevel.connectedLevels.push(connection.levelIid);
        }

        for (let i = 0; i < json.fieldInstances.length; i++) {
            let fieldInstance = json.fieldInstances[i];
            if (fieldInstance.__identifier == "Title") {
                thisLevel.title = fieldInstance.__value;
            }
        }

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

    currentLevelId = index;
    currentLevel = levels[index];
    titleElement.innerHTML = currentLevel.title;

    let center = createVector(currentLevel.x+(currentLevel.w/2), currentLevel.y+(currentLevel.h/2));
    
    cameraPositionOld = cameraPosition.copy();
    cameraPosition.x = center.x-(viewport.width/32)
    cameraPosition.y = center.y-(viewport.height/32)

   
}

function instantiateObject(objPrototype, position) { //maybe misuing the word prototype here, idk
    let obj = Object.create(objPrototype);
    obj.init(position);
    objects.push(obj);
}



//this whole function is pretty ugly and repetitive, but I'm not sure what the cleaner what to do it is
function moveAndSlide(obj, velocity) {
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
            if (currentLevel.tiles[truncatedX][i] == 1) {
                vel.x = 0;
                break;
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
            if (currentLevel.tiles[i][truncatedY] == 1) {
                vel.y = 0;
                break;
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
            if (currentLevel.tiles[i][truncatedY] == 1) {
                return true;
            }
        }
    }

    return false;
}



function draw() {
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
    viewport.translate(-(lerp(cameraPositionOld.x, cameraPosition.x, smoothTransition))*16, 
                       -(lerp(cameraPositionOld.y, cameraPosition.y, smoothTransition))*16); 

    transitionAnimationTick = min(transitionAnimationTick+0.025, 1);

    viewport.fill(220);
    viewport.rect(currentLevel.x*16, currentLevel.y*16, currentLevel.w*16, currentLevel.h*16)

    //draw tiles
    for (let y = 0; y < currentLevel.h; y++) {
        for (let x = 0; x < currentLevel.w; x++) {
            if (currentLevel.tiles[x][y] == 1) {
                viewport.image(imgTiles, (x+currentLevel.x)*16, (y+currentLevel.y)*16, 16, 16, 0, 0, 16, 16);
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
    viewport.fill(255);
    viewport.rect(cameraPosition.x*16, cameraPosition.y*16, viewport.width, ((currentLevel.y-cameraPosition.y)*16)+1)
    viewport.rect(cameraPosition.x*16, ((currentLevel.y+currentLevel.h)*16)-1, viewport.width, ((currentLevel.y+(viewport.height/16))-(currentLevel.y+currentLevel.h))*16)
    viewport.rect(cameraPosition.x*16, cameraPosition.y*16, ((currentLevel.x-cameraPosition.x)*16)+1, viewport.height);
    viewport.rect(((currentLevel.x+currentLevel.w)*16)-1, cameraPosition.y*16, ((currentLevel.x+(viewport.width/16))-(currentLevel.x+currentLevel.w))*16, viewport.height);

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
