import { World, Entity } from './ecs';

interface IName { name: string }
const Name = (name: string): IName => ({ name });

interface IVelocity { vx: number, vy: number }
const Velocity = (vx: number, vy: number): IVelocity => ({ vx, vy })

const world = World();

world.register(Name);
world.register(Velocity);

world.entity()
  .with(Name)("Bob")
  .build();
const ray = world.entity()
  .with(Name)("Ray")
  .with(Velocity)(-1, -2)
  .build();

const query = world.query(Entity, Name);

for (const [entity, name] of query.result()) {
  console.log(`[${entity}]: "${name.name}"`);
}

for (const [entity, name] of query.not(Velocity).result()) {
  console.log(`[${entity}]: "${name.name}"`);
}

world.remove(Velocity, ray);
for (const [entity, name] of query.not(Velocity).result()) {
  console.log(`[${entity}]: "${name.name}"`);
}

// import { keyboard } from './keyboard';
// const { Application, Sprite, Text, utils, Container } = PIXI; 
// const loader = PIXI.Loader.shared;
// const resources = loader.resources;

// let type = "WebGL";
// if (!utils.isWebGLSupported()) {
//   type = "canvas";
// }

// utils.sayHello(type);

// const app = new Application({
//   width: 512,
//   height: 512,
//   antialias: true,
//   transparent: false,
//   resolution: 1,
// });
// document.body.appendChild(app.view);

// loader
//   .add("assets/treasure-hunter.json")
//   .load(setup);

// // TODO - resources
// let state: (delta: number) => void; // TODO - enum?
// const gameScene = new Container();

// function setup() {
//   app.stage.addChild(gameScene);

//   const id = resources["assets/treasure-hunter.json"].textures;
//   if (typeof id === 'undefined') {
//     throw new TypeError('Expected resources to load');
//   }

//   state = play;

//   app.ticker.add((delta: number) => gameLoop(delta));
// }

// function gameLoop(delta: number) {
//   // systems

//   // game-state specific:
//   state(delta);
// }

// function play(delta: number) {
// }

// function end() {
//   // teardown
// }

// function randomInt(min: number, max: number): number {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// function hitTestRectangle(sprite1: PIXI.Sprite, sprite2: PIXI.Sprite): boolean {
//   return !(
//     sprite1.x + sprite1.width < sprite2.x ||
//     sprite1.x > sprite2.x + sprite2.width ||
//     sprite1.y + sprite1.height  < sprite2.y ||
//     sprite1.y > sprite2.y + sprite2.height
//   );
// }