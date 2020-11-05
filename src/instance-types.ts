/* eslint-disable @typescript-eslint/no-explicit-any */
type Length<T extends any[]> = T['length']

type Cast<X, Y> = X extends Y ? X : Y;

type Prepend<E, T extends any[]> =
  ((head: E, ...args: T) => any) extends ((...args: infer U) => any)
    ? U
    : T

type Pos<I extends any[]> =
  Length<I>;

type Next<I extends any[]> =
  Prepend<any, I>;

type Reverse<
  T extends any[],
  R extends any[] = [],
  I extends any[] = []
> = {
  0: Reverse<T, Prepend<T[Pos<I>], R>, Next<I>>
  1: R
}[
  Pos<I> extends Length<T>
    ? 1
    : 0
]

type Concat<T1 extends any[], T2 extends any[]> =
  Reverse<Reverse<T1> extends infer R ? Cast<R, any[]> : never, T2>;

type Append<E, T extends any[]> =
  Concat<T, [E]>;

export class Entity {
  "@@entity" = true; constructor(){
    throw new TypeError('Entity is not to be constructed.');
  }
}
type ComponentType<T extends {new(...args: any): any}> =
  T extends typeof Entity
    ? Entity // TODO - make it show as "Entity" ?
    : InstanceType<T>;

type InstanceTypesInternal<
  T extends { new(...args: any): any}[],
  R extends any[] = [],
  I extends any[] = []
> = {
  0: InstanceTypesInternal<
    T,
    Append<ComponentType<T[Pos<I>]>, R> extends infer U
      ? Cast<U, any[]>
      : never,
    Next<I>
  >
  1: R
}[
  Pos<I> extends Length<T>
    ? 1
    : 0
];

export type InstanceTypes<
  T extends { new(...args: any): any}[]
> = InstanceTypesInternal<T, [], []>;