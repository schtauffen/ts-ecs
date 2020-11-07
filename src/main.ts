// adapted from https://github.com/kittykatattack/learningPixi
import { World, IWorld, Entity } from './ecs';
import { keyboard } from './keyboard';

const { Application, Graphics, Sprite, Text, utils, Container, TextStyle } = PIXI; 
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
let gameOverScene: PIXI.Container;
const left = keyboard('ArrowLeft');
const up = keyboard('ArrowUp');
const right = keyboard('ArrowRight');
const down = keyboard('ArrowDown');
let player: number;
let outerBar: PIXI.Graphics;
let message: PIXI.Text;

interface IRenderable { sprite: PIXI.Sprite; }
const Renderable = (sprite: PIXI.Sprite): IRenderable => ({ sprite });
const SpriteAdded = () => ({});
interface IPosition { x: number, y: number }
const Position = (x: number, y: number): IPosition => ({ x, y });
interface IVelocity { vx: number, vy: number }
const Velocity = (vx: number, vy: number): IVelocity => ({ vx, vy });
const Blob = () => ({});
interface ILife { current: number, max: number }
const Life = (current: number, max: number): ILife => ({ current, max });
const PickupAble = () => ({});
const Exit = () => ({});

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
    .register(Life)
    .register(Exit)
    .register(PickupAble)
    ;

  world.entity()
    .with(Renderable)(new Sprite(id["dungeon.png"]))
    .build();
  
  world.entity()
    .with(Renderable)(new Sprite(id["door.png"]))
    .with(Position)(32, 0)
    .with(Exit)()
    .build();

  const explorer = new Sprite(id["explorer.png"]);
  player = world.entity()
    .with(Renderable)(explorer)
    .with(Position)(68, MAP_HEIGHT / 2 - explorer.height / 2)
    .with(Velocity)(0, 0)
    .with(Life)(100, 100)
    .build();

  const treasure = new Sprite(id["treasure.png"]);
  world.entity()
    .with(Renderable)(treasure)
    .with(Position)(
      MAP_WIDTH - treasure.width - 48,
      MAP_HEIGHT / 2 - treasure.height / 2
    )
    .with(PickupAble)()
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

  // UI
  // TODO - resourcify
  const healthBar = new Container();
  healthBar.position.set(MAP_WIDTH - 170, 4);
  healthBar.zIndex = 1000;
  gameScene.addChild(healthBar);

  const innerBar = new Graphics();
  innerBar.beginFill(0x000000);
  innerBar.drawRect(0, 0, 128, 8);
  innerBar.endFill();
  healthBar.addChild(innerBar);

  outerBar = new Graphics();
  outerBar.beginFill(0xFF3300);
  outerBar.drawRect(0, 0, 128, 8);
  outerBar.endFill();
  healthBar.addChild(outerBar);

  gameOverScene = new Container();
  app.stage.addChild(gameOverScene);
  gameOverScene.visible = false;

  const style = new TextStyle({
    fontFamily: "Futura",
    fontSize: 64,
    fill: "white"
  })
  message = new Text("The End!", style);
  message.x = (MAP_WIDTH - message.width) / 2;
  message.y = (MAP_HEIGHT - message.height) / 2;
  gameOverScene.addChild(message);

  state = play;

  app.ticker.add((delta: number) => gameLoop(world, delta));
}

function gameLoop(world: IWorld, delta: number) {
  state(world, delta);
}

function play(world: IWorld, delta: number) {
  // systems (TODO: move into world.system())
  // TODO - find nice way for pixi and ecs to play nicely together

  // PIXI.js system
  for (const [entity, renderable] of world.query(Entity, Renderable).not(SpriteAdded).result()) {
    gameScene.addChild(renderable.sprite);
    gameScene.children.sort((a, b) => a.zIndex - b.zIndex);
    world.add(SpriteAdded, entity)();
  }

  // Player system
  const PLAYER_SPEED = 1.5;
  const playerVelocity = world.get(Velocity, player);
  if (playerVelocity) {
    let vx = 0;
    let vy = 0;

    if (left.isDown) {
      vx -= PLAYER_SPEED;
    }
    if (right.isDown) {
      vx += PLAYER_SPEED;
    }
    if (up.isDown) {
      vy -= PLAYER_SPEED;
    }
    if (down.isDown) {
      vy += PLAYER_SPEED;
    }

    if (vx !== 0 && vy !== 0) {
      vx /= 1.4;
      vy /= 1.4;
    }

    playerVelocity.vx = vx;
    playerVelocity.vy = vy;
  }

  // movement/phsyics system
  for (const [position, velocity] of world.query(Position, Velocity).result()) {
    position.x += delta * velocity.vx;
    position.y += delta * velocity.vy;
  }

  // ai system
  for (const [position, velocity, renderable] of world.query(Position, Velocity, Renderable, Blob).result()) {
    if (position.y <= 0) {
      position.y = 0;
      velocity.vy *= -1;
    } else if (position.y >= MAP_HEIGHT - renderable.sprite.height) {
      position.y = MAP_HEIGHT - renderable.sprite.height;
      velocity.vy *= -1;
    }
  }

  // ??? system
  for (const [position, renderable] of world.query(Position, Renderable).result()) {
    renderable.sprite.position.set(position.x, position.y);
  }

  // Carry system
  const playerRender = world.get(Renderable, player);
  const playerPosition = world.get(Position, player);
  if (playerRender != null && playerPosition != null) {
    for (const [render, position] of world.query(Renderable, Position, PickupAble).result()) {
      if (hitTestRectangle(render.sprite, playerRender.sprite)) {
        position.x = playerPosition.x + (playerRender.sprite.width - render.sprite.width) / 2;
        position.y = playerPosition.y;
      }
    }
  }

  // TODO - hitbox should live in own component
  // TODO - component should determine if two objects can collide
  // "combat" system
  const playerLife = world.get(Life, player);
  if (playerRender != null && playerLife != null) {
    for (const [render,] of world.query(Renderable, Blob).result()) {
      if (hitTestRectangle(render.sprite, playerRender.sprite)) {
        playerLife.current -= 1;
      }
    }

    if (playerLife.current <= 0) {
      message.text = "You Lost";
      state = end;
    } else {
      outerBar.width = 128 * (playerLife.current / playerLife.max);
    }
  }

  // only ok since we know there is only 1 "pickupable" and exit
  for (const [pickupRender,] of world.query(Renderable, PickupAble).result()) {
    for (const [exitRender,] of world.query(Renderable, Exit).result()) {
      if (hitTestRectangle(pickupRender.sprite, exitRender.sprite)) {
        message.text = "You Win!"
        state = end;
      }
    }
  }
}

function end() {
  gameScene.visible = false;
  gameOverScene.visible = true;
  // TODO - way to restart
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