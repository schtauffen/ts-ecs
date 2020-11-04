/* eslint-disable @typescript-eslint/no-explicit-any */
type Params<F extends(...args: any[]) => any> =
  F extends ((...args: infer A) => any)
    ? A
    : never;

type Head<T extends any[]> =
  T extends [any, ...any[]]
    ? T[0]
    : never;

type Tail<T extends any[]> =
  ((...t: T) => any) extends ((_: any, ...tail: infer TT) => any)
    ? TT
    : [];

type HasTail<T extends any[]> =
  T extends ([] | [any])
    ? false
    : true;

// accessor
type Last<T extends any[]> = {
  0: Last<Tail<T>>
  1: Head<T>
}[
  HasTail<T> extends true
    ? 0
    : 1
]

type Length<T extends any[]> = T['length']

type Prepend<E, T extends any[]> =
  ((head: E, ...args: T) => any) extends ((...args: infer U) => any)
    ? U
    : T

type Drop<N extends number, T extends any[], I extends any[] = []> = {
  0: Drop<N, Tail<T>, Prepend<any, I>>
  1: T
}[
  Length<I> extends N
    ? 1
    : 0
]

type Pos<I extends any[]> =
  Length<I>;
type Next<I extends any[]> =
  Prepend<any, I>;
type Prev<I extends any[]> =
  Tail<I>;

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

export type InstanceTypes<
  T extends { new(...args: any): any}[],
  R extends any[] = [],
  I extends any[] = []
> = {
  0: InstanceTypes<
    T,
    Append<InstanceType<T[Pos<I>]>, R> extends infer U
      ? Cast<U, any[]>
      : never,
    Next<I>
  >
  1: R
}[
  Pos<I> extends Length<T>
    ? 1
    : 0
]

type Cast<X, Y> = X extends Y ? X : Y

class A {}
class B {}
class C {}
type test = InstanceTypes<[typeof A, typeof B, typeof C]>;

// Curry
const toCurry01 = (name: string, age: number, single: boolean) => true;
const curried01 = (name: string) => (age: number) => (single: boolean) => true;

type CurryV0<P extends any[], R> =
  (arg0: Head<P>) => HasTail<P> extends true
    ? CurryV0<Tail<P>, R>
    : R
declare function curryV0<P extends any[], R>(f: (...args: P) => R): CurryV0<P, R>;
const toCurry02 = (name: string, age: number, single: boolean) => true;
const curried02 = curryV0(toCurry02);
const test23 = curried02('Jane')(26)(true);

const curried03 = curryV0(toCurry02);
const curried04 = curried03('Jane');
const curried05 = curried04(26);
const test24 = curried05(true);

const test25 = curried02('Jane')('26')(true);

type test29 = Last<[1, 2, 3, 4]>;
type test30 = Length<[]>
type test31 = Length<[any, any]>
type test32 = Length<[any, any, any]>

type test34 = Prepend<string, []>;
type test35 = Prepend<number, [1, 2]>;

type test36 = [any, any, any];
type test37 = Length<test36>;
type test38 = Length<Prepend<any, test36>>;

type test39 = Drop<2, [0, 1, 2, 3]>;
type test40 = Drop<Length<test39>, [0]>

type test41 = Cast<[string], any>;
type test42 = Cast<[string], number>;

// type Query =

// Query
class Klass {}

function query<T extends { new(...args: any): any}>(t: T): InstanceType<T> {
  return new t();
}

const result = query(Klass);