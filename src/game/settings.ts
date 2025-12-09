import * as fs from "fs";
import * as E from "fp-ts/lib/Either.js";
import { pipe } from "fp-ts/lib/function.js";
import * as J from "fp-ts/lib/Json.js"; // Для безопасного парсинга JSON
import path from "path";
import * as D from "io-ts/lib/Decoder.js";

export interface GameSettings {
  rounds: number;
  carGeneration: {
    minYear: number;
    maxYear: number;
    minMileage: number;
    maxMileage: number;
  };
  scoreThreshold: number;
}

type ConfigNotFoundError = {
  readonly _tag: "ConfigNotFoundError";
  readonly filePath: string;
};

type ConfigReadError = {
  readonly _tag: "ConfigReadError";
  readonly message: string;
  readonly code: string;
  readonly filePath: string;
};

type JsonParseError = {
  readonly _tag: "JsonParseError";
  readonly message: string;
  readonly input: string;
};

type ValidateConfigError = {
  readonly _tag: "ValidateConfigError";
  readonly message: string;
  readonly input: string;
};

type ConfigErrors =
  | ConfigReadError
  | ConfigNotFoundError
  | JsonParseError
  | ValidateConfigError;

const readFileContent = (filePath: string): E.Either<ConfigErrors, string> => {
  try {
    const file = fs.readFileSync(filePath, { encoding: "utf-8" });

    return E.right(file);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;

    if (err.code === "ENOENT") {
      return E.left({
        _tag: "ConfigNotFoundError",
        filePath: path.resolve(filePath),
      });
    }

    return E.left({
      _tag: "ConfigReadError",
      message: err.message,
      code: err.code || "UNKNOWN",
      filePath: path.resolve(filePath),
    });
  }
};

const parseJson = (jsonString: string): E.Either<ConfigErrors, unknown> =>
  pipe(
    jsonString,
    J.parse,
    E.mapLeft(
      (e: unknown): JsonParseError => ({
        _tag: "JsonParseError",
        message: e instanceof Error ? e.message : String(e),
        input: jsonString,
      })
    )
  );

const isGameSettings = (u: unknown): u is GameSettings => {
  const decoder = D.struct<GameSettings>({
    rounds: pipe(
      D.number,
      D.refine((n): n is number => n >= 1 && n <= 1000, "rounds 1-1000")
    ),
    scoreThreshold: pipe(
      D.number,
      D.refine((n): n is number => n >= 0, "scoreThreshold >= 0")
    ),
    carGeneration: pipe(
      D.struct({
        minYear: pipe(
          D.number,
          D.refine(
            (n): n is number => n >= 1900 && n <= 2100,
            "minYear 1900-2100"
          )
        ),
        maxYear: pipe(
          D.number,
          D.refine(
            (n): n is number => n >= 1900 && n <= 2100,
            "maxYear 1900-2100"
          )
        ),
        minMileage: pipe(
          D.number,
          D.refine((n): n is number => n >= 0, "minMileage >= 0")
        ),
        maxMileage: pipe(
          D.number,
          D.refine((n): n is number => n >= 0, "maxMileage >= 0")
        ),
      }),
      D.refine(
        (cg): cg is GameSettings["carGeneration"] =>
          cg.minYear <= cg.maxYear && cg.minMileage <= cg.maxMileage,
        "carGeneration: min <= max"
      )
    ),
  });

  return pipe(u, decoder.decode, E.isRight);
};

const validateGameSettings = (
  u: unknown
): E.Either<ConfigErrors, GameSettings> => {
  return pipe(
    u,
    E.fromPredicate(
      isGameSettings,
      (): ValidateConfigError => ({
        _tag: "ValidateConfigError",
        message: "Некорректная структура GameSettings",
        input: JSON.stringify(u),
      })
    )
  );
};

export const readGameSettings = (
  filePath: string
): E.Either<ConfigErrors, GameSettings> => {
  return pipe(
    readFileContent(filePath),
    E.chain(parseJson),
    E.chain(validateGameSettings)
  );
};
