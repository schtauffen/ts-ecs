const { Application, Rectangle, Sprite, utils } = PIXI; 
const loader = PIXI.Loader.shared;
const resources = loader.resources;

let type = "WebGL";
if (!utils.isWebGLSupported()) {
  type = "canvas";
}

utils.sayHello(type);

const app = new Application({ width: 256, height: 256 });
document.body.appendChild(app.view);

loader
  .add("assets/spritesheet_01.png")
  .load(setup);

function setup() {
  const texture = resources["assets/spritesheet_01.png"].texture;
  const rectangle = new Rectangle(96, 64, 32, 32);
  texture.frame = rectangle;
  const rocket = new Sprite(texture);
  rocket.position.set(32, 32);
  app.stage.addChild(rocket);
  app.renderer.render(app.stage);
}