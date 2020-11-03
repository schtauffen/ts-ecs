/* eslint-disable @typescript-eslint/no-explicit-any */
declare const BitSet: any; // TODO - why doesn't BitSet load from main.d.ts?
let componentId = 0;
const components: IComponent[][] = []; // TODO - do we need to manage array growth?

interface IConstructor {
  // eslint-disable-next-line @typescript-eslint/ban-types
  new (...args: any[]): {};
}

export interface IComponent {
  readonly "@@id": number;
}

export interface IQuery {
  readonly "@@id": number;
  readonly "@@not": boolean;
  not(): IQuery;
}

interface IQueryAndComponentConstructor {
  // eslint-disable-next-line @typescript-eslint/ban-types
  new (...args: any[]): IComponent;
  readonly "@@id": number;
  readonly "@@not": boolean;
  not(): IQuery;
}

export function component(constructor: IConstructor): IQueryAndComponentConstructor {
  const currentId = componentId++;
  components[currentId] = components[currentId] || [];

  return class Component extends constructor {
    static readonly "@@id" = currentId;
    static readonly "@@not" = false;
    static not(): IQuery {
      return {
        "@@id": currentId,
        "@@not": true,
        not() { return Component },
      };
    }

    readonly "@@id" = currentId;

    constructor(...args: any[]) {
      super(...args);
    }
  }
}

export type Entity = number;
let entityId: Entity = 0;
const livingEntities: Map<Entity, typeof BitSet> = new Map();
// const dead_entities: Entity[] = [];

export class EntityBuilder {
  private components: IComponent[] = [];

  constructor() {
    this.build.bind(this);
    this.with.bind(this);
  }

  build(): number {
    const currentId = entityId++;
    const bitset = new BitSet();
    for (let i = 0; i < this.components.length; ++i) {
      components[this.components[i]["@@id"]][currentId] = this.components[i];
      bitset.set(this.components[i]["@@id"], 1);
    }
    livingEntities.set(currentId, bitset);
    return currentId;
  }

  with(component: IComponent): EntityBuilder {
    this.components.push(component);
    return this;
  }
}

const ZERO_BIT_SET = new BitSet();
export class Query {
  private has = new BitSet();
  private hasnt = new BitSet();
  private toReturn: IQuery[] = [];

  constructor(...queries: IQuery[]) {

    for (let i = 0; i < queries.length; ++i) {
      if (queries[i]["@@not"]) {
        this.hasnt.set(queries[i]["@@id"], 1);
      } else {
        this.toReturn.push(queries[i]);
        this.has.set(queries[i]["@@id"], 1);
      }
    }
  }

  // TODO - lazy iterator
  // TODO - memoize results
  // TODO - typings for [Entity, [A, B, ...]]? (MACROS?)
  //        or link to generics somehow? Query<A, B> -> [Entity, [A, B]]
  result(): [Entity, any[]][] {
    const entities: Entity[] = [];
    for (const [entity, bitset] of livingEntities.entries()) {
      if (this.has.and(bitset).equals(this.has) && this.hasnt.and(bitset).equals(ZERO_BIT_SET)) {
        entities.push(entity);
      }
    }

    return entities.map(entity => {
      return [entity, this.toReturn.map(query => {
        return components[query["@@id"]][entity]
      })];
    })
  }
}
