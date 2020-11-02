const { Application, Sprite, utils } = PIXI; 
const loader = PIXI.Loader.shared;
const resources = loader.resources;

let type = "WebGL";
if (!utils.isWebGLSupported()) {
  type = "canvas";
}

utils.sayHello(type);

const app = new Application({ width: 256, height: 256 });
document.body.appendChild(app.view);
app.renderer.backgroundColor = 0x061639;

loader
  .add("assets/cat.png")
  .load(setup);

function setup() {
  const cat = new Sprite(resources["assets/cat.png"].texture);
  cat.position.set(128, 128);
  cat.anchor.set(0.5, 0.5);
  cat.rotation = Math.PI;
  app.stage.addChild(cat);
}