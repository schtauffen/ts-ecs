// adapted from https://github.com/kittykatattack/learningPixi
import type * as CatHerder from 'cat-herder';
import { keyboard, KeyInfo } from './keyboard';

// Bundling cat-herder would have better ergonomics, but this is doable
declare const catHerder: typeof CatHerder;
const { World, Entity, createTag } = catHerder;
type Key = CatHerder.Key;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const PIXI: any;
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

enum State {
  Play,
  End,
}

interface Resources {
  id: PIXI.ITextureDictionary;
  gameScene: PIXI.Container;
  gameOverScene: PIXI.Container;
  left: KeyInfo;
  right: KeyInfo;
  up: KeyInfo;
  down: KeyInfo;
  player: Key;
  outerBar: PIXI.Graphics;
  message: PIXI.Text;
  delta: number;
  state: State,
}

// Components
interface IRenderable { sprite: PIXI.Sprite; }
const Renderable = (sprite: PIXI.Sprite): IRenderable => ({ sprite });
const SpriteAdded = createTag();
interface IPosition { x: number, y: number }
const Position = (x: number, y: number): IPosition => ({ x, y });
interface IVelocity { vx: number, vy: number }
const Velocity = (vx: number, vy: number): IVelocity => ({ vx, vy });
const Blob = createTag();
interface ILife { current: number, max: number }
const Life = (current: number, max: number): ILife => ({ current, max });
const PickupAble = createTag();
const Exit = createTag();

function setup() {
  const gameScene = new Container();
  // TODO - app to resource
  // TODO - gameScene to resource
  app.stage.addChild(gameScene);

  // TODO - to resource
  const maybeId = resources["assets/treasure-hunter.json"].textures;
  if (typeof maybeId === 'undefined') {
    throw new TypeError('Expected resources to load');
  }
  const id = maybeId;
  const healthBar = new Container();
  healthBar.position.set(MAP_WIDTH - 170, 4);
  healthBar.zIndex = 1000;
  gameScene.addChild(healthBar);

  const innerBar = new Graphics();
  innerBar.beginFill(0x000000);
  innerBar.drawRect(0, 0, 128, 8);
  innerBar.endFill();
  healthBar.addChild(innerBar);

  const outerBar = new Graphics();
  outerBar.beginFill(0xFF3300);
  outerBar.drawRect(0, 0, 128, 8);
  outerBar.endFill();
  healthBar.addChild(outerBar);

  const gameOverScene = new Container();
  app.stage.addChild(gameOverScene);
  gameOverScene.visible = false;

  const style = new TextStyle({
    fontFamily: "Futura",
    fontSize: 64,
    fill: "white"
  })
  const message = new Text("The End!", style);
  message.x = (MAP_WIDTH - message.width) / 2;
  message.y = (MAP_HEIGHT - message.height) / 2;
  gameOverScene.addChild(message);

  const world: CatHerder.World<Resources> = new World({
    id,
    gameScene,
    gameOverScene,
    player: {generation: 1, index: -1},
    left: keyboard('ArrowLeft'),
    right: keyboard('ArrowRight'),
    up: keyboard('ArrowUp'),
    down: keyboard('ArrowDown'),
    state: State.Play,
    outerBar,
    message,
    delta: 1,
  });

  world
    .register(Renderable)
    .register(SpriteAdded)
    .register(Position)
    .register(Velocity)
    .register(Blob)
    .register(Life)
    .register(Exit)
    .register(PickupAble)
    .system(pixiSystem)
    .system(playerInputSystem)
    .system(movementSystem)
    .system(blobAISystem)
    .system(pixiSpritePositionSystem)
    .system(carrySystem)
    .system(obstacleSystem)
    .system(winningSystem)
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
  world.resources.player = world.entity()
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

  app.ticker.add((delta: number) => {
    world.resources.delta = delta;

    switch (world.resources.state) {
      case State.Play: return world.update();
      default: {
        world.resources.gameScene.visible = false;
        world.resources.gameOverScene.visible = true;
      }
    }
  });
}

// Systems
function pixiSystem(world: CatHerder.World<Resources>) {
  for (const [entity, renderable] of world.query(Entity, Renderable).not(SpriteAdded)) {
    world.resources.gameScene.addChild(renderable.sprite);
    world.resources.gameScene.children.sort((a, b) => a.zIndex - b.zIndex);
    world.add(SpriteAdded, entity)();
  }
}

function playerInputSystem(world: CatHerder.World<Resources>) {
  const PLAYER_SPEED = 1.5;
  const playerVelocity = world.get(Velocity, world.resources.player);
  if (playerVelocity) {
    let vx = 0;
    let vy = 0;

    if (world.resources.left.isDown) {
      vx -= PLAYER_SPEED;
    }
    if (world.resources.right.isDown) {
      vx += PLAYER_SPEED;
    }
    if (world.resources.up.isDown) {
      vy -= PLAYER_SPEED;
    }
    if (world.resources.down.isDown) {
      vy += PLAYER_SPEED;
    }

    if (vx !== 0 && vy !== 0) {
      vx /= 1.4;
      vy /= 1.4;
    }

    playerVelocity.vx = vx;
    playerVelocity.vy = vy;
  }
}

function movementSystem(world: CatHerder.World<Resources>) {
  for (const [position, velocity] of world.query(Position, Velocity)) {
    position.x += world.resources.delta * velocity.vx;
    position.y += world.resources.delta * velocity.vy;
  }
}

function blobAISystem(world: CatHerder.World<Resources>) {
  for (const [position, velocity, renderable] of world.query(Position, Velocity, Renderable, Blob)) {
    if (position.y <= 0) {
      position.y = 0;
      velocity.vy *= -1;
    } else if (position.y >= MAP_HEIGHT - renderable.sprite.height) {
      position.y = MAP_HEIGHT - renderable.sprite.height;
      velocity.vy *= -1;
    }
  }
}

function pixiSpritePositionSystem(world: CatHerder.World<Resources>) {
  for (const [position, renderable] of world.query(Position, Renderable)) {
    renderable.sprite.position.set(position.x, position.y);
  }
}

function carrySystem(world: CatHerder.World<Resources>) {
  const playerRender = world.get(Renderable, world.resources.player);
  const playerPosition = world.get(Position, world.resources.player);

  if (playerRender != null && playerPosition != null) {
    for (const [render, position] of world.query(Renderable, Position, PickupAble)) {
      if (hitTestRectangle(render.sprite, playerRender.sprite)) {
        position.x = playerPosition.x + (playerRender.sprite.width - render.sprite.width) / 2;
        position.y = playerPosition.y;
      }
    }
  }
}

function obstacleSystem(world: CatHerder.World<Resources>) {
  const playerRender = world.get(Renderable, world.resources.player);
  const playerLife = world.get(Life, world.resources.player);
  if (playerRender != null && playerLife != null) {
    for (const [render,] of world.query(Renderable, Blob)) {
      if (hitTestRectangle(render.sprite, playerRender.sprite)) {
        playerLife.current -= 1;
      }
    }

    if (playerLife.current <= 0) {
      world.resources.message.text = "You Lost";
      world.resources.state = State.End;
    } else {
      world.resources.outerBar.width = 128 * (playerLife.current / playerLife.max);
    }
  }
}

function winningSystem(world: CatHerder.World<Resources>) {
  for (const [pickupRender,] of world.query(Renderable, PickupAble)) {
    for (const [exitRender,] of world.query(Renderable, Exit)) {
      if (hitTestRectangle(pickupRender.sprite, exitRender.sprite)) {
        world.resources.message.text = "You Win!"
        world.resources.state = State.End;
      }
    }
  }
}

// utils
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