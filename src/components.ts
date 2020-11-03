import { component } from './ecs';

export const Name = component(class {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
})

export const Velocity = component(class {
  vx: number;
  vy: number;

  constructor(vx = 0, vy = 0) {
    this.vx = vx;
    this.vy = vy;
  }
}) 
