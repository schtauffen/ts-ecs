/* eslint-disable @typescript-eslint/no-unused-vars */
function assert(a: any, b: any) {
  if (a !== b) {
    throw new Error(`expected ${a} to equal ${b}`)
  }
}

const simpleAdd = (x: number, y: number) => x + y
assert(simpleAdd(4, 6), 10);

const curriedAdd = (x: number) => (y: number) => x + y;
assert(curriedAdd(4)(2), 6);
const temp = curriedAdd(15);
assert(temp(5), 20);

type Tuple = ['a', number, string[]];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const test05 = (..._args: Tuple) => true
assert(test05('a', 42, []), true);

const fn00 = (name: string, age: number, single: boolean) => true;
type test07 = Parameters<typeof fn00>;

type Params<F extends(...args: any[]) => any> =
  F extends ((...args: infer A) => any)
    ? A
    : never;
type test08 = Params<typeof fn00>;

type Head<T extends any[]> =
  T extends [any, ...any[]]
    ? T[0]
    : never;

type test09 = Head<[1, 2, string, number]>;
type test10 = Head<Params<typeof fn00>>;

type Tail<T extends any[]> =
  ((...t: T) => any) extends ((_: any, ...tail: infer TT) => any)
    ? TT
    : [];
type test11 = Tail<[1, 2, string, number]>;
type test12 = Tail<Params<typeof fn00>>;
type test13 = Tail<test12>;

type HasTail<T extends any[]> =
  T extends ([] | [any])
    ? false
    : true;
  
type params = [1, 2, string];
type test14 = HasTail<params>;
type test15 = HasTail<Tail<params>>;
type test16 = HasTail<Tail<Tail<params>>>;

// property type from object
type ObjectInfer<O> =
  O extends { a: infer A }
    ? A
    : never;
const object = { a: 'hello' }
type test17 = ObjectInfer<typeof object>;
type test18 = ObjectInfer<string>

// innter type from function
type FunctionInfer<F> =
  F extends (...args: infer A) => infer R
    ? [A, R]
    : never;
const fn01 = (a: number, b: any) => true;
type test19 = FunctionInfer<typeof fn01>;

// extract generic types
type ClassInfer<I> =
  I extends Promise<infer G>
    ? G
    : never;
const promise = new Promise<string>(() => { console.log('foo'); });
type test20 = ClassInfer<typeof promise>;

// extract from array
type ArrayInfer<T> =
  T extends (infer U)[]
    ? U
    : never;
const array = [0, 'data', 1, 'data'];
type test21 = ArrayInfer<typeof array>;

// extract from tuple
type TupleInfer<T> =
  T extends [infer A, ...(infer B)[]]
    ? [A, B]
    : never;
type test22 = TupleInfer<[string, number, boolean]>;

export default null;
