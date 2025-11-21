import { compose } from "./compose.js";
import assert from "node:assert";

// Тестовые функции
const increment = (x: number) => x + 1;
const toString = (x: number) => `${x}!`;
const g = (x: string) => `g(${x})`;
const h = (x: string) => `h(${x})`;
const f = (x: string) => `f(${x})`;

// Тест 1: Проверка compose(increment, increment)
assert.strictEqual(
  compose(increment, increment)(2),
  4,
  "compose(increment, increment)(2) должно быть 4"
);

// Тест 2: Проверка compose(toString, increment)
assert.strictEqual(
  compose(toString, increment)(2),
  "3!",
  'compose(toString, increment)(2) должно быть "3!"'
);

assert.strictEqual(compose(f, h, g)("2"), "f(h(g(2)))", '"f(h(g(2)))"');

console.log("Все тесты пройдены успешно");
