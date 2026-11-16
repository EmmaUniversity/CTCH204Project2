//for the sake of resizing the canvas
const scale = window.devicePixelRatio
const canvasHeight = 400
const canvasWidth = 600;

const objPlayer = {
    position: null,
    size: null, //used for collision
    velocity: null,

    init: function(pos) {
        this.position = createVector(pos.x, pos.y);
        this.size = createVector(1, 1);
        this.velocity = createVector(0, 0)
    },
    step: function() {
        this.velocity.y += 0.025;
        this.velocity = moveAndSlide(this, this.velocity);
    },
    draw: function() {
        image(imgPlayer, this.position.x*16, this.position.y*16);
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
}

let imgTiles;
let imgPlayer;

let levels = [];
let levelNames;
let currentLevel;
let currentLevelId;

let objects = [];

let cameraPosition;

//this whole function is pretty ugly and repetitive, but I'm not sure what the cleaner what to do it is
function moveAndSlide(obj, velocity) {
    //technically I could just let moveAndSlide update the object's actual velocity,
    //and maybe this would save a couple lines of code, but this feels safer
    let vel = velocity.copy();

    //X
    let rowSpan = createVector(floor(obj.position.y-currentLevel.y), floor((obj.position.y+obj.size.y)-currentLevel.y))
    
    //set checking point, if traveling right, use position + width, if traveling left, just use position
    let intendedX; 
    if (velocity.x > 0) {
        intendedX = obj.position.x+vel.x+obj.size.x
    } else {
        intendedX = obj.position.x+vel.x
    }

    //index into the tiles matrix
    let truncatedX = floor(intendedX-currentLevel.x);

    //check for any collisions
    for (let i = rowSpan.x; i <= rowSpan.y; i++) {
        if (currentLevel.tiles[truncatedX][i] == 1) {
            vel.x = 0;
            break;
        }
    }

    //update position
    if (vel.x == velocity.x) {
        obj.position.x += vel.x;
    } else {
        if (velocity.x > 0) {
            obj.position.x = (truncatedX+currentLevel.x)-obj.size.x;
        } else {
            obj.position.x = truncatedX+currentLevel.x;
        }
    }


    //Y
    let columnSpan = createVector(floor(obj.position.x-currentLevel.x), floor((obj.position.x+obj.size.x)-currentLevel.x))

    let intendedY;
    if (velocity.y > 0) {
        intendedY = obj.position.y+vel.y+obj.size.y
    } else {
        intendedY = obj.position.y+vel.y
    }

    let truncatedY = floor(intendedY-currentLevel.y);

    for (let i = columnSpan.x; i <= columnSpan.y; i++) {
        if (currentLevel.tiles[i][truncatedY] == 1) {
            vel.y = 0;
            break;
        }
    }

    if (vel.y == velocity.y) {
        obj.position.y += vel.y;
    } else {
        if (velocity.y > 0) {
            obj.position.y = (truncatedY+currentLevel.y)-obj.size.y;
        } else {
            obj.position.y = truncatedY+currentLevel.y;
        }
    }

    return vel;
}

function instantiateObject(objPrototype, position) { //maybe misuing the word prototype here, idk
    let obj = Object.create(objPrototype);
    obj.init(position);
    objects.push(obj);
}

async function loadLevels() {
    let levelsJson = await loadJSON("p5js_project/levels.ldtk");
    levelNames = new Map;

    for (let i = 0; i < levelsJson.levels.length; i++) {
        let json = levelsJson.levels[i];
        let thisLevel = Object.create(level); //naming this weird because of the way I named the tempalte object ;-;
        
        thisLevel.id = i;
        thisLevel.name = json.identifier;
        thisLevel.x = json.worldX/16;
        thisLevel.y = json.worldY/16;
        thisLevel.w = json.pxWid/16;
        thisLevel.h = json.pxHei/16;

        thisLevel.tiles = []; //without this, all levels reference the same tiles array
        for (let x = 0; x < json.pxWid; x++) {
            let row = []
            thisLevel.tiles.push(row)
            for (let y = 0; y < json.pxHei; y++) {
                row.push(json.layerInstances[1].intGridCsv[(y*16)+x])
            }
        }

        levels.push(thisLevel);
        levelNames.set(json.identifier, i);
    }
}

async function setup() {
    //rescale the canvas so that it displays at 1 unit = 1 screen pixel
    // css pixels do not necessarily equal physical pixels
    // which means that any pixel art will get akwardly rescaled when drawn to the screen.
    createCanvas(canvasWidth, canvasHeight);
    print(scale)
    let canvasElement = document.getElementById("defaultCanvas0");
    canvasElement.setAttribute('style', 'width: ' + str(canvasWidth/scale) + 'px; height: ' + str(canvasHeight/scale) + 'px;')

    await loadLevels();

    cameraPosition = createVector(-32, -32);
    imgTiles = await loadImage("p5js_project/assets/tiles.png");
    imgPlayer = await loadImage("p5js_project/assets/player.png");
    
    instantiateObject(objPlayer, createVector(4, 4));
    instantiateObject(objPlayer, createVector(3, 4));
    instantiateObject(objPlayer, createVector(7, 6));

    loadLevel(0);
}

function loadLevel(index) {
    currentLevelId = index;
    currentLevel = levels[index];
}

function draw() {
    background(220);
    
    for (var i = 0; i < objects.length; i++) {
        objects[i].step();
    }

    //noStroke();
    //fill("red")
    //for (let i = 0; i < levels.length; i++) {
    //    var thisLevel = levels[i]
    //    rect((canvasWidth/2)+thisLevel.x/16, (canvasHeight/2)+thisLevel.y/16, thisLevel.w/16, thisLevel.h/16);
    //}

    translate(-cameraPosition.x, -cameraPosition.y);
    
    for (let y = 0; y < currentLevel.h; y++) {
        for (let x = 0; x < currentLevel.w; x++) {
            if (currentLevel.tiles[x][y] == 1) {
                image(imgTiles, x*16, y*16, 16, 16, 0, 0, 16, 16);
            }
        }
    }

    for (var i = 0; i < objects.length; i++) {
        objects[i].draw();
    }

}
