import { pipe } from "fp-ts/lib/function.js";
import * as E from "fp-ts/lib/Either.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import * as RTE from "fp-ts/lib/ReaderTaskEither.js";
import * as IOE from "fp-ts/lib/IOEither.js";
import { log } from "fp-ts/lib/Console.js";
import * as NonEmptyArray from "fp-ts/lib/NonEmptyArray.js";
import * as readline from "readline";
import { readGameSettings, type GameSettings } from "./settings.js";
import { generateCar } from "./carGenerator.js";
import { ordCar } from "./compare.js";
import type { Car } from "./types.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

type Env = { rl: readline.Interface };

const generateRound = (settings: GameSettings) => ({
  car1: generateCar(settings),
  car2: generateCar(settings),
});

const generateRounds = (settings: GameSettings) =>
  pipe(
    NonEmptyArray.range(0, settings.rounds - 1),
    NonEmptyArray.map(() => generateRound(settings)),
    IOE.of
  );

type Round = {
  car1: Car;
  car2: Car;
};

const ask =
  (questionStr: string): RTE.ReaderTaskEither<Env, Error, string> =>
  ({ rl }) =>
    TE.tryCatch(
      () => new Promise((resolve) => rl.question(questionStr, resolve)),
      E.toError
    );

const runGame = (
  rounds: NonEmptyArray.NonEmptyArray<Round>
): RTE.ReaderTaskEither<Env, Error, ReadonlyArray<number>> => {
  const playRound = (round: Round): RTE.ReaderTaskEither<Env, Error, number> =>
    pipe(
      RTE.fromIO(
        log(
          `\nВыберите машину:\n1. ${round.car1.brand} ${round.car1.year} (${round.car1.mileage}km)\n2. ${round.car2.brand} ${round.car2.year} (${round.car2.mileage}km)`
        )
      ),
      RTE.chain(() => ask("Ваш выбор (1 или 2): ")),
      RTE.chain((choice) => {
        const numericChoice = parseInt(choice, 10);
        if (
          isNaN(numericChoice) ||
          (numericChoice !== 1 && numericChoice !== 2)
        ) {
          return RTE.left(new Error("Неверный выбор. Введите 1 или 2."));
        }
        const comparison = ordCar.compare(round.car1, round.car2);

        if (comparison === 0) {
          return pipe(
            RTE.fromIO(log("Ничья!")),
            RTE.map(() => 0)
          );
        }

        if (
          (comparison === 1 && numericChoice === 1) ||
          (comparison === -1 && numericChoice === 2)
        ) {
          return pipe(
            RTE.fromIO(log("☄️  Вы угадали!")),
            RTE.map(() => 1)
          );
        }

        return pipe(
          RTE.fromIO(log("🛑  Вы не угадали!")),
          RTE.map(() => 0)
        );
      })
    );

  return pipe(rounds, NonEmptyArray.traverse(RTE.ApplicativeSeq)(playRound));
};

const calculateScore = (scores: ReadonlyArray<number>): number =>
  scores.reduce((acc, score) => acc + score, 0);

const finishGame = (score: number) =>
  RTE.fromIO(log(`\n📊  Ваш итоговый счет: ${score}`));

const run = pipe(
  readGameSettings("./src/game/settings.json"),
  IOE.fromEither,
  IOE.flatMap(generateRounds),
  RTE.fromIOEither,
  RTE.flatMap(runGame),
  RTE.map(calculateScore),
  RTE.flatMap(finishGame)
);

(async () => {
  const main = run({ rl });

  await main();

  rl.close();
})();
