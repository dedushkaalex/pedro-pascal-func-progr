# Конспект: `Reader`, `ReaderTaskEither` — Управление зависимостями

## 1. Проблема: "Протаскивание" зависимостей

Представьте, что у вас есть несколько функций, и каждой из них для работы нужен некий объект с конфигурацией или зависимостями (например, настройки, подключение к БД, логгер).

```typescript
interface Dependencies {
  apiUrl: string;
  logger: (message: string) => void;
}

const getUser = (deps: Dependencies, id: number): Promise<User> => {
  deps.logger(`Fetching user ${id}`);
  return fetch(`${deps.apiUrl}/users/${id}`).then(res => res.json());
};

const getPostsForUser = (deps: Dependencies, user: User): Promise<Post[]> => {
  deps.logger(`Fetching posts for ${user.name}`);
  return fetch(`${deps.apiUrl}/posts?userId=${user.id}`).then(res => res.json());
};

// При использовании нам приходится постоянно передавать `deps`
const deps: Dependencies = { apiUrl: '...', logger: console.log };
getUser(deps, 1).then(user => getPostsForUser(deps, user));
```
Это работает, но `deps` загромождает все сигнатуры функций.

## 2. Решение: `Reader<R, A>`

`Reader<R, A>` — это тип, представляющий вычисление, которое зависит от окружения `R` (read-only) для получения результата `A`. По сути, это просто обертка над функцией `(r: R) => A`.

`Reader` позволяет нам "спрятать" зависимость от окружения. Функции больше не принимают `deps` как явный аргумент. Вместо этого они возвращают `Reader`, который "знает", что ему понадобятся `deps` в будущем.

```typescript
import * as R from 'fp-ts/Reader';
import { pipe } from 'fp-ts/function';

// Функция теперь возвращает Reader, который "ждет" зависимостей
const getUserR = (id: number): R.Reader<Dependencies, Promise<User>> =>
  (deps: Dependencies) => { // Внутри Reader'а у нас есть доступ к deps
    deps.logger(`Fetching user ${id}`);
    return fetch(`${deps.apiUrl}/users/${id}`).then(res => res.json());
  };
```
Ключевая идея: **мы отделяем определение вычисления от его выполнения**.

### Композиция с `chain`

С помощью `R.chain` мы можем соединять функции, возвращающие `Reader`, не передавая зависимости вручную.

```typescript
const getPostsForUserR = (user: User): R.Reader<Dependencies, Promise<Post[]>> =>
  (deps) => { /* ... */ };

const getPostsForUserId = (id: number): R.Reader<Dependencies, Promise<Post[]>> =>
  pipe(
    getUserR(id), // Reader<Dependencies, Promise<User>>
    R.chain(userPromise => // userPromise - это Promise<User>
      // Мы не можем напрямую использовать user, т.к. он внутри Promise
      // Для этого нам нужны более мощные типы
    )
  );
```
Как видно, комбинировать `Reader` с `Promise` напрямую неудобно. Для этого и существуют "комбинированные" типы.

## 3. `ReaderTaskEither<R, E, A>` — "Святой Грааль"

`ReaderTaskEither` (сокращенно `RTE`) объединяет в себе сразу три концепции:
- `Reader`: Зависимость от окружения `R`.
- `Task`: Асинхронное вычисление.
- `Either`: Возможность ошибки `E`.

Это тип для вычисления, которое:
1.  **Требует** окружение `R`.
2.  **Асинхронно**.
3.  **Может завершиться с ошибкой**.

`ReaderTaskEither<Dependencies, Error, A>` — это практически все, что нужно для описания большинства операций в бэкенде или сложном фронтенде.

### Пример с `ReaderTaskEither`

```typescript
import * as RTE from 'fp-ts/ReaderTaskEither';

// Теперь сигнатура функции полностью описывает операцию
const getUserRTE = (id: number): RTE.ReaderTaskEither<Dependencies, Error, User> =>
  // `ask` позволяет "заглянуть" в окружение
  pipe(
    RTE.ask<Dependencies>(),
    RTE.chainTaskEitherK(deps =>
      TE.tryCatch( // TE.tryCatch из TaskEither для Promise
        () => {
          deps.logger(`Fetching user ${id}`);
          return fetch(`${deps.apiUrl}/users/${id}`).then(res => res.json());
        },
        (reason) => new Error(String(reason))
      )
    )
  );

const getPostsForUserRTE = (user: User): RTE.ReaderTaskEither<Dependencies, Error, Post[]> =>
  pipe(
    RTE.ask<Dependencies>(),
    RTE.chainTaskEitherK(deps => /* ... */)
  );

// Композиция становится элегантной
const getPostsForUserIdRTE = (id: number): RTE.ReaderTaskEither<Dependencies, Error, Post[]> =>
  pipe(
    getUserRTE(id),       // RTE<Deps, Error, User>
    RTE.chain(getPostsForUserRTE) // RTE.chain "распаковывает" User и передает в getPostsForUserRTE
  );

// **Запуск вычисления**
// Вся наша сложная логика — это просто `getPostsForUserIdRTE(1)`.
// Чтобы ее запустить, мы должны предоставить реальные зависимости.
// Это делается ОДИН раз, в самом конце, на "границе" нашего приложения.

const myDependencies: Dependencies = { apiUrl: '...', logger: console.log };

// Запускаем и обрабатываем результат
pipe(
  getPostsForUserIdRTE(1),
  RTE.match(
    (error) => `Ошибка: ${error.message}`,
    (posts) => `Найдено ${posts.length} постов`
  )
)(myDependencies) // <-- Внедряем зависимости здесь!
  .then(console.log); // <-- Запускаем Task
```

## 4. Применение в нашей игре

-   `readGameSettings` останется как есть, так как это точка входа, где мы *получаем* нашу зависимость.
-   `generateCar` можно переписать, чтобы он не принимал `settings`, а возвращал `R.Reader<GameSettings, Car>`.
-   `playRound` (который мы собираемся написать) станет `RTE.ReaderTaskEither<GameSettings, Error, number>` (очки за раунд).
-   `runGame` станет функцией, которая создает и запускает эту большую `ReaderTaskEither` цепочку, передавая в нее `settings`, полученные в самом начале.
