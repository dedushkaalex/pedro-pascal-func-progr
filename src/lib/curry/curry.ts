/* eslint-disable @typescript-eslint/no-explicit-any */
export type Curried<T extends (...args: any[]) => any> = T extends (
  ...args: infer Args
) => infer R
  ? Args extends [infer A, ...infer Rest]
    ? (arg: A) => Curried<(...args: Rest) => R>
    : R
  : never;

export const curry = <T extends (...args: any[]) => any>(fn: T): Curried<T> => {
  const arity = fn.length;

  return function $curried(...args: Array<any>) {
    if (arity >= fn.length) {
      return fn(...args);
    }
    return (...next: any) => $curried(...args, ...next);
  } as Curried<T>;
};

const sum2 = curry((x: number, y: number) => x + y);

console.log(sum2(2)(2));
