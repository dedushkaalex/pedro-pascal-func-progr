/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function compose<A, B>(ab: (a: A) => B): (a: A) => B;

export function compose<A, B, C>(bc: (b: B) => C, ab: (a: A) => B): (a: A) => C;

export function compose<A, B, C, D>(
  cd: (c: C) => D,
  bc: (b: B) => C,
  ab: (a: A) => B
): (a: A) => D;

export function compose<A, B, C, D, E>(
  de: (d: D) => E,
  cd: (c: C) => D,
  bc: (b: B) => C,
  ab: (a: A) => B
): (a: A) => E;

export function compose<A, B, C, D, E, F>(
  ef: (e: E) => F,
  de: (d: D) => E,
  cd: (c: C) => D,
  bc: (b: B) => C,
  ab: (a: A) => B
): (a: A) => F;

export function compose(...fns: any[]) {
  return (arg: any) => fns.reduceRight((acc, fn) => fn(acc), arg);
}
