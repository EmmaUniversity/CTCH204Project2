const scale = window.devicePixelRatio
const canvasHeight = 400
const canvasWidth = 600;

function setup() {
    //rescale the canvas so that it displays at 1 unit = 1 screen pixel
    // css pixels do not necessarily equal physical pixels
    // which means that any pixel art will get akwardly rescaled when drawn to the screen.
    createCanvas(canvasWidth, canvasHeight);
    print(scale)
    let canvasElement = document.getElementById("defaultCanvas0");
    print(canvasElement)
    canvasElement.setAttribute('style', 'width: ' + str(canvasWidth/scale) + 'px; height: ' + str(canvasHeight/scale) + 'px;')
    print(canvasElement)
}

function draw() {
    background(220);
    textSize(25);
    text("[insert makey makey project here]", 10, 25)
}
