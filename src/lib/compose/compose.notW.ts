/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
type Func<TIn, TOut> = (arg: TIn) => TOut;
type ComposeTuple<T extends Array<Func<any, any>>> = T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
    ? F extends Func<infer _A, infer B>
      ? ComposeTuple<R extends Array<Func<any, any>> ? R : never> extends Func<
          infer C,
          infer _D
        >
        ? Func<C, B>
        : never
      : never
    : never;

export function compose<T extends Array<Func<any, any>>>(
  ...fns: T
): ComposeTuple<T> {
  return ((arg: any) =>
    fns.reduceRight((acc, fn) => fn(acc), arg)) as ComposeTuple<T>;
}
