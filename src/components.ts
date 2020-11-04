import { Component } from './ecs';

@Component
export class Name {
  constructor(public name: string) {}
}

@Component
export class Velocity {
  constructor(public vx = 0, public vy = 0) {}
}
