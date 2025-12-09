import { pipe } from "fp-ts/lib/function.js";
import * as E from "fp-ts/lib/Either.js";
import * as T from "fp-ts/lib/Task.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import * as RTE from "fp-ts/lib/ReaderTaskEither.js";
import * as IO from "fp-ts/lib/IO.js";
import * as readline from "readline";
import { readGameSettings, type GameSettings } from "./settings.js";
import { generateCar } from "./carGenerator.js";
import { ordCar } from "./compare.js";

const log =
  (...args: ReadonlyArray<unknown>): IO.IO<void> =>
  () => {
    console.log(...args);
  };

const askQuestion = (query: string): TE.TaskEither<Error, string> =>
  TE.tryCatch(
    () =>
      new Promise((resolve) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        rl.question(query, (answer) => {
          rl.close();
          resolve(answer);
        });
      }),
    (reason) => new Error(String(reason))
  );

const main = (): void => {
  pipe(
    log('--- Запуск игры "Оценщик автомобилей" ---'),
    IO.chain(() => {
      const settingsEither = readGameSettings("./src/game/settings.json");

      return pipe(
        settingsEither,
        E.match(
          (error) => {
            return pipe(
              log("Критическая ошибка: не удалось загрузить настройки игры."),
              IO.chain(() => log(error))
            );
          },
          (settings) => {
            return pipe(
              log("Настройки успешно загружены. Начинаем игру!"),
              IO.chain(() => runGame(settings)) // <--- FIX 1
            );
          }
        )
      );
    })
  )();
};

const playRound = (
  roundNum: number
): RTE.ReaderTaskEither<GameSettings, Error, number> =>
  pipe(
    RTE.ask<GameSettings>(),
    RTE.chain((settings) =>
      pipe(
        RTE.fromIO(log(`\n--- Раунд ${roundNum} ---`)),
        RTE.chain(() => {
          const carA = generateCar(settings);
          const carB = generateCar(settings);

          return pipe(
            RTE.fromIO(
              log(`A: ${carA.brand} ${carA.year}г., пробег ${carA.mileage}км`)
            ),
            RTE.chain(() =>
              RTE.fromIO(
                log(`B: ${carB.brand} ${carB.year}г., пробег ${carB.mileage}км`)
              )
            ),
            RTE.chain(() => {
              const result = ordCar.compare(carA, carB);
              const correctAnswer = result === 1 ? "a" : "b";

              return pipe(
                askQuestion("Какая машина дороже? (a/b): "),
                RTE.fromTaskEither,
                RTE.chain((answer) => {
                  const userAnswer = answer.toLowerCase().trim();
                  if (userAnswer !== "a" && userAnswer !== "b") {
                    return RTE.left(
                      new Error('Некорректный ввод. Введите "a" или "b".')
                    );
                  }

                  if (userAnswer === correctAnswer) {
                    return pipe(
                      RTE.fromIO(log("✅ Верно!")),
                      RTE.map(() => 1)
                    );
                  } else {
                    return pipe(
                      RTE.fromIO(
                        log(
                          `❌ Ошибка! Правильный ответ: ${correctAnswer.toUpperCase()}`
                        )
                      ),
                      RTE.map(() => 0)
                    );
                  }
                })
              );
            })
          );
        })
      )
    )
  );

const gameLoop = (
  currentRound: number,
  totalScore: number
): RTE.ReaderTaskEither<GameSettings, Error, number> =>
  pipe(
    RTE.ask<GameSettings>(),
    RTE.chain((settings) => {
      if (currentRound > settings.rounds) {
        return RTE.right(totalScore);
      }

      return pipe(
        playRound(currentRound),
        RTE.chain((roundScore) => {
          const newScore = totalScore + roundScore;
          return pipe(
            RTE.fromIO(log(`Текущий счет: ${newScore}`)),
            RTE.chain(() => gameLoop(currentRound + 1, newScore))
          );
        })
      );
    })
  );

const runGame = (settings: GameSettings) => {
  return pipe(
    RTE.fromIO(log(`Игра будет состоять из ${settings.rounds} раундов.`)),
    RTE.chain(() => gameLoop(1, 0)),
    RTE.match(
      (error) => T.fromIO(log("\nИгра завершилась с ошибкой:", error.message)),
      (finalScore) =>
        T.fromIO(
          log(`\n--- Игра окончена! --- \nВаш итоговый счет: ${finalScore}`)
        )
    )
  )(settings);
};

main();
