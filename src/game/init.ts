// // import { sequenceS } from "fp-ts/Apply"
// import * as Console from "fp-ts/lib/Console.js";
// // import * as Eq from "fp-ts/Eq"
// // import * as IO from "fp-ts/IO"
// import * as IOE from "fp-ts/lib/IOEither.js";
// // import { concatAll } from "fp-ts/Monoid"
// // import * as NonEmptyArray from "fp-ts/NonEmptyArray"
// // import * as Ord from "fp-ts/Ord"
// // import * as R from "fp-ts/Random"
// // import * as RTE from "fp-ts/ReaderTaskEither"
// // import { pipe } from "fp-ts/function"
// import { toError } from "fp-ts/lib/Either.js";
// // import * as N from "fp-ts/number"
// // import * as t from "io-ts"
// // import * as tt from "io-ts-types"
// import { readFileSync } from "node:fs";
// import path from "node:path";
// import { fileURLToPath } from "url";
// import { dirname } from "path";
// import { pipe } from "fp-ts/lib/function.js";

// import readline from "node:readline";

/**
 * Напишем простую игру - оценщиdк автомобилей.
 * Игра состоит из 10 раундов. Если в раунде игрок оценивает верно, то получает +1 очко, иначе - ничего.
 *
 * Настройки игры читаются из settings.json.
 * В нашей игре машины дороже когда
 * - они новее
 * - у них более дорогая марка(BMW > Audi > Ford)
 * - у них более дорогой двигатель(дизель > бензин > электро)
 * - у них меньше пробег(с допустимой разницей в 100 км)
 */

// const __dirname = dirname(fileURLToPath(import.meta.url))

// const readFile = (path: string): IOE.IOEither<Error, string> =>
//   IOE.tryCatch(() => readFileSync(path, "utf-8"), toError)

// const filePath = path.join(__dirname, "settings.json")

// const result = pipe(filePath, readFile)
// console.log(result())

import * as fs from "fs";
import * as readline from "readline";
import { pipe } from "fp-ts/lib/function.js";
import * as E from "fp-ts/lib/Either.js";
import * as T from "fp-ts/lib/Task.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import * as RTE from "fp-ts/lib/ReaderTaskEither.js";
import * as A from "fp-ts/lib/Array.js";
import * as Ord from "fp-ts/lib/Ord.js";
import * as N from "fp-ts/lib/number.js";
import * as R from "fp-ts/lib/Reader.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

// ==========================================
// 1. Типы данных и Окружение (Environment)
// ==========================================

interface Car {
  readonly brand: string;
  readonly engine: string;
  readonly year: number;
  readonly mileage: number;
}

// Наши настройки (Environment)
interface Settings {
  readonly minYear: number;
  readonly maxYear: number;
  readonly mileageDifference: number;
  readonly allowedEngines: string[];
  readonly allowedBrands: string[];
  readonly maxMileage: number;
  readonly numRounds: number;
}

// App<A> - это программа, которой нужны Settings, которая может вернуть ошибку Error, или результат A.
type App<A> = RTE.ReaderTaskEither<Settings, Error, A>;

// ==========================================
// 2. Чистая логика (Reader)
// ==========================================
// Здесь мы используем просто Reader, так как асинхронность не нужна,
// но нужен доступ к конфигу для сравнения.

const getBrandRank = (brand: string): number =>
  ({ BMW: 3, Audi: 2, Ford: 1 })[brand] || 0;

const getEngineRank = (engine: string): number =>
  ({ diesel: 3, petrol: 2, electric: 1 })[engine] || 0;

const compareByMileageWithBuffer =
  (buffer: number) =>
  (a: Car, b: Car): number => {
    const diff = Math.abs(a.mileage - b.mileage);
    if (diff <= buffer) return 0;
    return a.mileage < b.mileage ? 1 : -1;
  };

// Эта функция теперь возвращает Reader, который "ждет" настройки, чтобы вернуть число сравнения
const compareCars =
  (c1: Car, c2: Car): R.Reader<Settings, number> =>
  (settings) => {
    const byYear = pipe(
      N.Ord,
      Ord.contramap((c: Car) => c.year)
    );
    const byBrand = pipe(
      N.Ord,
      Ord.contramap((c: Car) => getBrandRank(c.brand))
    );
    const byEngine = pipe(
      N.Ord,
      Ord.contramap((c: Car) => getEngineRank(c.engine))
    );

    const yearRes = byYear.compare(c1, c2);
    if (yearRes !== 0) return yearRes;

    const brandRes = byBrand.compare(c1, c2);
    if (brandRes !== 0) return brandRes;

    const engineRes = byEngine.compare(c1, c2);
    if (engineRes !== 0) return engineRes;

    return compareByMileageWithBuffer(settings.mileageDifference)(c1, c2);
  };

// ==========================================
// 3. Утилиты (Wrappers)
// ==========================================

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Обертки, поднимающие обычные действия до уровня нашего App (RTE)

// Получить доступ к настройкам внутри пайплайна
const getSettings: App<Settings> = RTE.ask<Settings, Error>();

const print = (msg: string): App<void> => RTE.fromIO(() => console.log(msg));

const ask = (q: string): App<string> =>
  RTE.fromTask(() => new Promise((resolve) => rl.question(q, resolve)));

// ==========================================
// 4. Генерация (использует Reader для доступа к лимитам)
// ==========================================

const generateCar: App<Car> = pipe(
  getSettings, // 1. Спрашиваем настройки у монады
  RTE.map((s) => {
    // 2. Используем их для генерации (синхронно, поэтому map)
    const brand = s.allowedBrands[randomInt(0, s.allowedBrands.length - 1)];
    const engine = s.allowedEngines[randomInt(0, s.allowedEngines.length - 1)];
    const year = randomInt(s.minYear, s.maxYear);
    const mileage = randomInt(0, s.maxMileage);
    return { brand, engine, year, mileage };
  })
);

// ==========================================
// 5. Игровой процесс
// ==========================================

const playRound = (roundNum: number): App<number> => {
  return pipe(
    RTE.Do,
    // Генерируем машины. Заметьте, мы НЕ передаем settings вручную!
    RTE.bind("c1", () => generateCar),
    RTE.bind("c2", () => generateCar),
    RTE.chainFirst(({ c1, c2 }) =>
      pipe(
        print(`\n--- Раунд ${roundNum} ---`),
        RTE.chain(() =>
          print(`1: ${c1.brand}, ${c1.year}, ${c1.engine}, ${c1.mileage}km`)
        ),
        RTE.chain(() =>
          print(`2: ${c2.brand}, ${c2.year}, ${c2.engine}, ${c2.mileage}km`)
        )
      )
    ),
    RTE.bind("answer", () => ask("Что дороже? (1/2): ")),
    RTE.bind("settings", () => getSettings), // Достаем настройки для сравнения
    RTE.map(({ c1, c2, answer, settings }) => {
      // Запускаем Reader с логикой сравнения
      const result = compareCars(c1, c2)(settings);

      let expected = result > 0 ? "1" : result < 0 ? "2" : "equal";
      const isCorrect = expected === "equal" || answer.trim() === expected;

      console.log(isCorrect ? "✅ Верно!" : "❌ Ошибка!");
      return isCorrect ? 1 : 0;
    })
  );
};

// Рекурсивный цикл игры
const gameLoop = (currentRound: number, totalScore: number): App<void> => {
  return pipe(
    getSettings,
    RTE.chain((settings) => {
      if (currentRound > settings.numRounds) {
        return pipe(
          print(
            `\n🏁 Игра окончена! Счет: ${totalScore} / ${settings.numRounds}`
          ),
          RTE.chain(() => RTE.fromIO(() => rl.close()))
        );
      }

      return pipe(
        playRound(currentRound),
        RTE.chain((points) => gameLoop(currentRound + 1, totalScore + points))
      );
    })
  );
};

// ==========================================
// 6. Загрузка и Запуск (Wiring)
// ==========================================

const __dirname = dirname(fileURLToPath(import.meta.url));

const loadSettings = (): TE.TaskEither<Error, Settings> =>
  pipe(
    TE.tryCatch(
      () =>
        fs.promises.readFile(path.join(__dirname, "settings.json"), "utf-8"),
      E.toError
    ),
    TE.chain((json) =>
      TE.fromEither(E.tryCatch(() => JSON.parse(json), E.toError))
    )
  );

const main = () => {
  // 1. Сначала загружаем настройки (это "грязная" фаза инициализации)
  const programStart = pipe(
    loadSettings(),
    TE.chain((settings) => {
      // 2. Запускаем нашу программу (App), передавая в неё настройки
      // RTE (App) - это функция: (settings) => TaskEither
      const appEffect = gameLoop(1, 0);

      return appEffect(settings); // ВОТ ЗДЕСЬ происходит Dependency Injection
    }),
    // Обработка финального результата или ошибки всей программы
    TE.fold(
      (err) => T.fromIO(() => console.error("Critical Error:", err)),
      () => T.fromIO(() => console.log("Bye!"))
    )
  );

  // Запуск Task
  programStart();
};

main();
