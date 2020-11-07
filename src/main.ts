// adapted from https://github.com/kittykatattack/learningPixi
import { World, IWorld, Entity } from './ecs';
import { keyboard } from './keyboard';

const { Application, Sprite, Text, utils, Container } = PIXI; 
const loader = PIXI.Loader.shared;
const resources = loader.resources;

let type = "WebGL";
if (!utils.isWebGLSupported()) {
  type = "canvas";
}

utils.sayHello(type);

// why aren't app.stage.height and .width these working?
const MAP_HEIGHT = 512;
const MAP_WIDTH = 512;

const app = new Application({
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  antialias: true,
  transparent: false,
  resolution: 1,
});
document.body.appendChild(app.view);

loader
  .add("assets/treasure-hunter.json")
  .load(setup);

// TODO - resources
let state: (world: IWorld, delta: number) => void; // TODO - enum?
let id: PIXI.ITextureDictionary; // TODO - resource
let gameScene: PIXI.Container;

interface IRenderable { sprite: PIXI.Sprite; }
const Renderable = (sprite: PIXI.Sprite): IRenderable => ({ sprite });
const SpriteAdded = () => ({});
interface IPosition { x: number, y: number }
const Position = (x: number, y: number): IPosition => ({ x, y });
interface IVelocity { vx: number, vy: number }
const Velocity = (vx: number, vy: number): IVelocity => ({ vx, vy });
const Blob = () => ({});

function setup() {
  gameScene = new Container();
  const world = World();
  // TODO - app to resource
  // TODO - gameScene to resource
  app.stage.addChild(gameScene);

  // TODO - to resource
  const maybeId = resources["assets/treasure-hunter.json"].textures;
  if (typeof maybeId === 'undefined') {
    throw new TypeError('Expected resources to load');
  }
  id = maybeId;

  world
    .register(Renderable)
    .register(SpriteAdded)
    .register(Position)
    .register(Velocity)
    .register(Blob)
    ;

  world.entity()
    .with(Renderable)(new Sprite(id["dungeon.png"]))
    .build();
  
  world.entity()
    .with(Renderable)(new Sprite(id["door.png"]))
    .with(Position)(32, 0)
    .build();

  const explorer = new Sprite(id["explorer.png"]);
  world.entity()
    .with(Renderable)(explorer)
    .with(Position)(68, MAP_HEIGHT / 2 - explorer.height / 2)
    .with(Velocity)(0, 0)
    .build();

  const treasure = new Sprite(id["treasure.png"]);
  world.entity()
    .with(Renderable)(treasure)
    .with(Position)(
      MAP_WIDTH - treasure.width - 48,
      MAP_HEIGHT / 2 - treasure.height / 2
    )
    .build();

  const numberOfBlobs = 6;
  const spacing = 48;
  const xOffset = 150;
  const speed = 2;
  let direction = 1;

  for (let i = 0; i < numberOfBlobs; ++i) {
    const blob = new Sprite(id["blob.png"]);
    const x = spacing * i + xOffset;
    const y = randomInt(0, MAP_HEIGHT - blob.height);

    world.entity()
      .with(Renderable)(blob)
      .with(Position)(x, y)
      .with(Velocity)(0, speed * direction)
      .with(Blob)()
      .build();
    
    direction *= -1;
  }
  
  state = play;

  app.ticker.add((delta: number) => gameLoop(world, delta));
}

function gameLoop(world: IWorld, delta: number) {
  // systems (TODO: move into world.system())
  // TODO - find nice way for pixi and ecs to play nicely together
  for (const [entity, renderable] of world.query(Entity, Renderable).not(SpriteAdded).result()) {
    gameScene.addChild(renderable.sprite);
    world.add(SpriteAdded, entity)();
  }

  for (const [position, velocity] of world.query(Position, Velocity).result()) {
    position.x += delta * velocity.vx;
    position.y += delta * velocity.vy;
  }

  for (const [position, velocity, renderable] of world.query(Position, Velocity, Renderable, Blob).result()) {
    if (position.y <= 0) {
      position.y = 0;
      velocity.vy *= -1;
    } else if (position.y >= MAP_HEIGHT - renderable.sprite.height) {
      position.y = MAP_HEIGHT - renderable.sprite.height;
      velocity.vy *= -1;
    }
  }

  for (const [position, renderable] of world.query(Position, Renderable).result()) {
    renderable.sprite.position.set(position.x, position.y);
  }

  // game-state specific:
  state(world, delta);
}

function play(world: IWorld, delta: number) {
}

function end() {
  // teardown
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