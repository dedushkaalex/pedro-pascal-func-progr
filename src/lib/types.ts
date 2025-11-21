export interface Functor<T> {
  map: <U>(fn: (value: T) => U) => Functor<U>;
}

/**
 * flatMap/chain/bind/join - разворачивает контейнер
 */
export interface Monad<T> extends Functor<T> {
  flatMap: <U>(fn: (value: T) => Monad<U>) => Monad<U>;
}
