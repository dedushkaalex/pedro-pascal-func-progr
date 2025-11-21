import { Either } from "./either.js";

const e = Either.right(3);
console.log(e.isRight());
