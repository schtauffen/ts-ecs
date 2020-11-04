/* eslint-disable @typescript-eslint/no-explicit-any */
declare const BitSet: any;
let componentId = 0;
const components: any[][] = [];

export function Component<T extends { new(...args: any): any }>(target: T): T {
  const currentId = componentId++;
  target.prototype["@@id"] = currentId;
  (target as any)["@@id"] = currentId;
  components[currentId] = [];
  return target;
}

interface IQueryable {
  "@@id": number;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Queryable {}
function isQueryable(t: any): t is IQueryable {
  if (t && typeof t["@@id"] === 'number') {
    return true;
  }
  return false;
}

export type Entity = number;
let entityId: Entity = 0;
const livingEntities: Map<Entity, typeof BitSet> = new Map();
// const dead_entities: Entity[] = [];

export class EntityBuilder {
  private components: IQueryable[] = [];

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

  with(component: Queryable): EntityBuilder {
    if (!isQueryable(component)) throw new TypeError(`Not queryable ${typeof component}`);
    this.components.push(component);
    return this;
  }
}

// TODO - function that returns { not(query), result() } object
interface IQueryTemplate<T> {
  query: T;
  hasnt: typeof BitSet;
  has: typeof BitSet;
}

interface IQueryChain<T> {
  not(...notQueries: IQueryable[]): IQueryChain<T>;
  result(): T[]; 
}

function createQueryChain<T extends any[]>(template: IQueryTemplate<T>): IQueryChain<T> {
  return {
    not(...hasnt: IQueryable[]) {
      return createQueryChain({ ...template, hasnt });
    },
    result() {
      const entities: Entity[] = [];
      for (const [entity, bitset] of livingEntities.entries()) {
        if (template.has.and(bitset).equals(template.has) && template.hasnt.and(bitset).equals(0)) {
          entities.push(entity);
        }
      }

      const results = [];
      for (const entity of entities) {
        const result = [];
        for (const query of template.query) {
          result.push(components[query["@@id"]][entity])
        }
        results.push(result);
      }
      return results as T[];
    }
  }
}

export function Query<T extends any[]>(...query: T): IQueryChain<T> {
  const has = BitSet();
  for (const q of query) {
    if (!isQueryable(q)) throw new TypeError(`Expected Component, received "${typeof q}"`);
    has.set(q["@@id"], 1);
  }
  return createQueryChain<T>({ query: query, has, hasnt: BitSet() });
}
