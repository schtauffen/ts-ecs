import { keyboard } from './keyboard';
// import { EntityBuilder, Query } from "./ecs";
// import { Name, Velocity } from './components';
import "./tut";

const { Application, Sprite, Text, utils } = PIXI; 
const loader = PIXI.Loader.shared;
const resources = loader.resources;

let type = "WebGL";
if (!utils.isWebGLSupported()) {
  type = "canvas";
}

utils.sayHello(type);

const app = new Application({
  width: 512,
  height: 512,
  antialias: true,
  transparent: false,
  resolution: 1,
});
document.body.appendChild(app.view);

loader
  .add("assets/treasure-hunter.json")
  .load(setup);

class VelocitySprite extends Sprite {
  public vx: number;
  public vy: number;
  public velocity: {
    set: (vx: number, vy: number) => void;
  };

  constructor(texture: PIXI.Texture | undefined) {
    super(texture);
    this.vx = 0;
    this.vy = 0;
    this.velocity = {
      set: (vx, vy) => {
        this.vx = vx; 
        this.vy = vy;
      }
    }
  }

  tick(delta: number) {
    this.x += this.vx * delta;
    this.y += this.vy * delta;
  }
}

function setup() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const id = resources["assets/treasure-hunter.json"].textures!;

  const dungeon = new Sprite(id["dungeon.png"]);
  app.stage.addChild(dungeon);

  const explorer = new VelocitySprite(id["explorer.png"]);
  explorer.x = 68;
  explorer.y = app.stage.height / 2 - explorer.height / 2;
  app.stage.addChild(explorer);

  app.ticker.add(delta => gameLoop(delta))

  const treasure = new Sprite(id["treasure.png"]);
  treasure.x = app.stage.width - treasure.width - 48;
  treasure.y = app.stage.height / 2 - treasure.height / 2;
  app.stage.addChild(treasure);

  const door = new Sprite(id["door.png"]);
  door.x = 32;
  app.stage.addChild(door);

  const BLOB_COUNT = 6;
  const BLOB_SPACING = 48
  const BLOB_OFFSET_X = 150;
  for (let i = 0; i < BLOB_COUNT; ++i) {
    const blob = new Sprite(id["blob.png"]);
    const x = BLOB_SPACING * i + BLOB_OFFSET_X;
    const y = randomInt(0, app.stage.height - blob.height);
    blob.position.set(x, y);
    app.stage.addChild(blob);
  }

  const left = keyboard('ArrowLeft');
  const right = keyboard('ArrowRight');
  const up = keyboard('ArrowUp');
  const down = keyboard('ArrowDown');

  left.press = () => { explorer.vx -= 2; };
  left.release = () => { explorer.vx += 2; };
  up.press = () => { explorer.vy -= 2; }
  up.release = () => { explorer.vy += 2; }
  right.press = () => { explorer.vx += 2; };
  right.release = () => { explorer.vx -= 2; };
  down.press = () => { explorer.vy += 2; }
  down.release = () => { explorer.vy -= 2; }

  const style = new PIXI.TextStyle({
    fill: 'white',
    stroke: 'black',
    strokeThickness: 4,
  });
  const message = new Text("No collision", style);
  message.y = 10;
  message.x = 10;
  app.stage.addChild(message);

  function gameLoop(delta: number) {
    explorer.tick(delta);

    if (hitTestRectangle(explorer, treasure)) {
      message.text = "Hit!";
      message.tint = 0xff3300;
    } else {
      message.text = "No collision..."
      message.tint = 0xccff99;
    }
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hitTestRectangle(sprite1: PIXI.Sprite, sprite2: PIXI.Sprite): boolean {
  return !(
    sprite1.x + sprite1.width < sprite2.x ||
    sprite1.x > sprite2.x + sprite2.width ||
    sprite1.y + sprite1.height  < sprite2.y ||
    sprite1.y > sprite2.y + sprite2.height
  );
}

// new EntityBuilder().with(new Velocity(1, 0)).with(new Name("bob")).build();
// new EntityBuilder().with(new Velocity()).build();
// new EntityBuilder().with(new Velocity(-1, -1)).with(new Name("ross")).build();

// const query = Query(Velocity, Name); 
// for (const [velocity, name] of query.result()) {
//   console.log((velocity as unknown as Velocity).vx);
//   console.log(name.name);
// }