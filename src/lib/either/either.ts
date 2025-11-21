import type { Monad } from "../types.js";

export abstract class Either<E, R> implements Monad<R> {
  static right<R, E = never>(value: R): Right<R> {
    return Right.of(value);
  }

  abstract map<U>(transformFn: (value: R) => U): Either<E, U>;

  abstract flatMap<U>(transformFn: (value: R) => Monad<U>): Monad<U>;
}

export class Right<R, E = never> extends Either<E, R> {
  constructor(readonly value: R) {
    super();
  }

  static of<R>(value: R) {
    return new Right(value);
  }

  map<U>(transformFn: (r: R) => U): Either<E, U> {
    return new Right(transformFn(this.value));
  }

  public flatMap<U>(transformFn: (r: R) => Either<E, U>): Either<E, U> {
    return transformFn(this.value);
  }

  public isLeft(): this is Left<never, R> {
    return false;
  }

  public isRight(): this is Right<never, R> {
    return true;
  }
}

export class Left<E, R = never> extends Either<E, R> {
  constructor(readonly value: E) {
    super();
  }

  static of<E>(value: E) {
    return new Left(value);
  }

  map<U>(_fn: (r: R) => U): Either<E, U> {
    return new Left(this.value);
  }

  public flatMap<U>(_fn: (r: R) => Either<E, U>): Either<E, U> {
    return new Left(this.value);
  }

  public isLeft(): this is Left<never, R> {
    return true;
  }

  public isRight(): this is Right<never, R> {
    return false;
  }
}
