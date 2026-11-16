//for the sake of resizing the canvas
const scale = window.devicePixelRatio
const canvasHeight = 400
const canvasWidth = 600;

const level = {
    id: 0,
    name: "",
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    connectedLevels: [],
    data: null
}

const levelData = {

}

let levels = [];

async function loadLevels() {
    let levelsJson = await loadJSON("p5js_project/levels.ldtk");

    for (let i = 0; i < levelsJson.levels.length; i++) {
        var json = levelsJson.levels[i];
        var thisLevel = Object.create(level); //naming this weird because of the way I named the tempalte object ;-;
        
        thisLevel.id = i;
        thisLevel.name = json.identifier;
        thisLevel.x = json.worldX;
        thisLevel.y = json.worldY;
        thisLevel.w = json.pxWid;
        thisLevel.h = json.pxHei;

        levels.push(thisLevel);
    }
    //Object.create
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
}

function draw() {
    background(220);
    textSize(25);
    
    noStroke();
    fill("red")
    for (let i = 0; i < levels.length; i++) {
        var thisLevel = levels[i]
        rect((canvasWidth/2)+thisLevel.x/16, (canvasHeight/2)+thisLevel.y/16, thisLevel.w/16, thisLevel.h/16);
    }
}
