/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Cast, Prepend, Pos, Reverse, Length, Next } from './type-utils';
export * from './type-utils';
declare const BitSet: any;

type QueryResult<T extends ComponentFactory> =
  T extends typeof Entity
    ? number
    : ReturnType<T>;

type ReturnTypesInternal<
  T extends ComponentFactory[],
  R extends any[] = [],
  I extends any[] = []
> = {
  0: ReturnTypesInternal<
    T,
    Prepend<QueryResult<T[Pos<I>]>, R>,
    Next<I>
  >
  1: R
}[
  Pos<I> extends Length<T>
    ? 1
    : 0
];

type ReturnTypes<
  T extends ComponentFactory[]
> = ReturnTypesInternal<
  Reverse<T> extends infer U ? Cast<U, any[]> : never,
  [],
  []
>

type Component = Record<string, any>;
interface ComponentFactory {
  (...args: any): Component;
}

export function Entity (): { "@@entity": true } {
  throw new Error(`Construct entities with World#entity()`);
}

//  World
//    Resources
//  ✓ Entities
//  ✓ Components
//    Systems
interface IWorld {
  register(factory: ComponentFactory): IWorld;
  get<T extends ComponentFactory>(factory: T, entity: number): ReturnType<T> | null;
  add<T extends ComponentFactory>(factory: T, entity: number): BoundFactory<void, T>;
  remove(factory: ComponentFactory, entity: number): void;
  query<T extends ComponentFactory[]>(...factories: T): QueryBuilder<ReturnTypes<T>[]>;
  entity(): EntityBuilder;
  delete(entity: number): void;
}

type BoundFactory<R, T extends ComponentFactory> = (...args: Parameters<T>) => R;

interface EntityBuilder {
  with<T extends ComponentFactory>(factory: T): BoundFactory<EntityBuilder, T>;
  build(): number;
}

interface QueryBuilder<R> {
  not(...factories: ComponentFactory[]): QueryBuilder<R>;
  result(): R; 
}

export function World(): IWorld {
  let componentId = 0;
  let entityId = 0;
  const componentsMap: Map<ComponentFactory, Component[]> = new Map();
  const componentsBit: Map<ComponentFactory, number> = new Map();
  const entities: Map<number, typeof BitSet> = new Map();
  const w = window as any;
  w.componentsMap = componentsMap;
  w.componentsBit = componentsBit;
  w.entities = entities;

  function toBitset(factories: ComponentFactory[]): typeof BitSet {
    const bitset = new BitSet();

    for (const factory of factories) {
      if (factory === Entity) {
        continue;
      }

      const bit = componentsBit.get(factory);
      if (typeof bit === 'undefined') {
        throw new TypeError(`Attempted to query unknown Component: ${factory.name}`);
      }

      bitset.set(bit, 1);
    }

    return bitset;
  }

  let world: IWorld;
  return world = {
    register(factory) {
      componentsMap.set(factory, []);
      componentsBit.set(factory, componentId++);
      return world as unknown as IWorld;
    },

    get<T extends ComponentFactory>(factory: T, entity: number) {
      const components = componentsMap.get(factory);
      if (components === undefined) {
        throw new TypeError(`Attempted to get unknown Component: ${factory.name}`);
      }

      const component = components[entity];
      return typeof component === undefined ? null : component as ReturnType<T>;
    },

    // TODO - lazy iterator?
    query<T extends ComponentFactory[]>(...factories: T): QueryBuilder<ReturnTypes<T>[]> {
      const has = toBitset(factories);
      let hasnt = BitSet();

      let query: QueryBuilder<ReturnTypes<T>[]>;
      return query = {
        not(...factories) {
          hasnt = toBitset(factories);
          return query;
        },

        result() {
          const results: any[] = [];
          for (const [entity, bitset] of entities.entries()) {
            if (has.and(bitset).equals(has) && hasnt.and(bitset).equals(0)) {
              const result = new Array(factories.length);
              for (const [idx, factory] of factories.entries()) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                result[idx] = factory === Entity ? entity : componentsMap.get(factory)![entity];
              }
              results.push(result);
            }
          }

          return results as unknown as ReturnTypes<T>[];
        }
      };
    },

    entity() {
      const entity = entityId++;
      const parts: [any, any][] = [];
      let builder: EntityBuilder;

      return builder = {
        with<T extends ComponentFactory>(factory: T) {
          return function (...args: Parameters<T>) {
            parts.push([factory, args]);
            return builder;
          }
        },

        build() {
          const entityMask = new BitSet();
          for (const [factory, args] of parts) {
            const bit = componentsBit.get(factory);
            const components = componentsMap.get(factory);
            if (bit === undefined || components === undefined) {
              throw new TypeError(`Attempted to add unknown Component to entity: ${factory.name}`);
            }

            components[entity] = factory(args);
            entityMask.set(bit, 1);
          }
          entities.set(entity, entityMask);
          return entity;
        }
      };
    },

    add(factory, entity) {
      return (...args) => {
        const entityMask = entities.get(entity);
        if (entityMask === undefined) {
          throw new TypeError(`Attempted to add Component to unknown entity.`);
        }

        const bit = componentsBit.get(factory);
        const components = componentsMap.get(factory);
        if (bit === undefined || components === undefined) {
          throw new TypeError(`Attempted to add unknown Component to entity: ${factory.name}`);
        }

        components[entity] = factory(args);
        entityMask.set(bit, 1);
      };
    },

    remove(factory, entity) {
      const bit = componentsBit.get(factory);
      const components = componentsMap.get(factory);
      if (bit === undefined || components === undefined) {
        throw new TypeError(`Attempted to remove Component from entity that didn't exist: ${factory.name}`);
      }

      const entityMask = entities.get(entity);
      if (entityMask === undefined) {
        throw new TypeError(`Attempted to remove Component from unknown entity.`);
      }

      delete components[entity];
      entityMask.set(bit, 0);
    },

    delete(entity) {
      // TODO - component clean up... ?
      entities.delete(entity);
    },
  } as IWorld;
}
