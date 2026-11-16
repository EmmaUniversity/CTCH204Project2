//for the sake of resizing the canvas
const scale = window.devicePixelRatio
const canvasHeight = 400
const canvasWidth = 600;

const objPlayer = {
    x: 0,
    y: 0,
    w: 16, //used for collision
    h: 16, //used for collision
    xSpd: 0,
    ySpd: 0,
    step: function() {
        this.x += this.xSpd;
        this.y += this.ySpd;
        this.ySpd += 0.25;
    },
    draw: function() {
        image(imgPlayer, this.x, this.y);
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

//TODO:
function moveAndSlide(obj, velocity) {
    
}

async function loadLevels() {
    let levelsJson = await loadJSON("p5js_project/levels.ldtk");
    levelNames = new Map;

    for (let i = 0; i < levelsJson.levels.length; i++) {
        let json = levelsJson.levels[i];
        let thisLevel = Object.create(level); //naming this weird because of the way I named the tempalte object ;-;
        
        thisLevel.id = i;
        thisLevel.name = json.identifier;
        thisLevel.x = json.worldX;
        thisLevel.y = json.worldY;
        thisLevel.w = json.pxWid;
        thisLevel.h = json.pxHei;

        thisLevel.tiles = []; //without this, all levels reference the same tiles array
        for (let x = 0; x < json.pxWid/16; x++) {
            let row = []
            thisLevel.tiles.push(row)
            for (let y = 0; y < json.pxHei/16; y++) {
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
    objects.push(Object.create(objPlayer));

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
    
    for (let y = 0; y < currentLevel.h/16; y++) {
        for (let x = 0; x < currentLevel.w/16; x++) {
            if (currentLevel.tiles[x][y] == 1) {
                image(imgTiles, x*16, y*16, 16, 16, 0, 0, 16, 16);
            }
        }
    }

    for (var i = 0; i < objects.length; i++) {
        objects[i].draw();
    }

}
