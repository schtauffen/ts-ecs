/* eslint-disable @typescript-eslint/no-explicit-any */
import { InstanceTypes, Entity } from './instance-types';
export * from './instance-types';
declare const BitSet: any;

// TODO - should be owned by a "World"
let componentId = 0;
const components: any[][] = [];

export function Component<T extends { new(...args: any): any }>(target: T): T {
  const currentId = componentId++;
  target.prototype["@@id"] = currentId;
  (target as any)["@@id"] = currentId;
  components[currentId] = [];
  return target;
}

// TODO IQueryable fix... to reflect metadata?
interface IQueryable {
  "@@id": number;
}
interface IQueryableConstructor {
  new(...args: any) : any;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Queryable {} // Placeholder type to hint to users
function isQueryable(t: any): t is IQueryable {
  if (t && typeof t["@@id"] === 'number') {
    return true;
  }
  return false;
}

let entityId = 0;
const livingEntities: Map<number, typeof BitSet> = new Map();
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

export class Query<T extends IQueryableConstructor[]> {
  private query: IQueryable[];
  private has = new BitSet();
  private hasnt = new BitSet();

  constructor(...query: T) {
    const queryable = Array(query.length);
    for (const [idx, q] of query.entries()) {
      if (!isQueryable(q)) throw new TypeError(`Expected Component type, received ${q}`)
      this.has.set(q["@@id"], 1);
      queryable[idx] = q;
    }
    // safe because it is validated above
    this.query = queryable;
  }

  not(...query: IQueryableConstructor[]): Query<T> {
    for (const q of query) {
      if (!isQueryable(q)) throw new TypeError(`Expected Component type, received ${q}`)
      this.hasnt.set(q["@@id"], 1);
    }
    return this;
  }

  // TODO - make to return lazy iterator. -or- should be another function?
  result(): InstanceTypes<T>[] {
    const results = [];

    for (const [entity, bitset] of livingEntities.entries()) {
      if (this.has.and(bitset).equals(this.has) && this.hasnt.and(bitset).equals(0)) {
        const result = new Array(this.query.length);
        for (const [idx, query] of this.query.entries()) {
          result[idx] === Entity
            ? entity
            : components[query["@@id"]][entity];
        }
        results.push(result);
      }
    }

    return results as unknown as InstanceTypes<T>[];
  }
}
