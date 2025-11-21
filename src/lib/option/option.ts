import { compose } from "../compose/compose.js";

type DivideTwo = (x: number) => number;
const divideTwo: DivideTwo = (x) => 2 / x;

type Increment = (x: number) => number;
const increment: Increment = (x) => x + 1;

// console.log(divideTwo(8));
// console.log(divideTwo(0));

const result = compose(increment, divideTwo);

// console.log(result(2));
// console.log(result(0));

export type Option<T> = Some<T> | None;
export interface Some<T> {
  _tag: "Some";
  value: T;
}

export interface None {
  _tag: "None";
}

export const some = <T>(value: T): Option<T> => ({
  _tag: "Some",
  value,
});
export const none: Option<never> = {
  _tag: "None",
};

export const isNone = <T>(value: Option<T>): value is None =>
  value._tag === "None";

const divideTwo2 = (x: number): Option<number> =>
  x === 0 ? none : some(2 / x);

/*  Argument of type '(x: number) => Option<number>' is not assignable to parameter of type '(a: number) => number'.
  Type 'Option<number>' is not assignable to type 'number'.
  Type 'None' is not assignable to type 'number'. (ts 2345)
*/
/**
 * Данное решение не очень хорошее, это нужно поправить с помощью функторов
 */
const composed2 = compose(
  (x: Option<number>) => (isNone(x) ? none : some(increment(x.value))),
  divideTwo2
);
console.log(JSON.stringify(composed2(2), null, 2));
