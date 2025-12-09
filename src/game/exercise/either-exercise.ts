/**
 * Упражнение: Использование `fp-ts/Either` для безопасного чтения настроек
 *
 * Цель: Научиться безопасно читать и парсить файл `settings.json` с помощью `fp-ts/Either`.
 *
 * Инструкция:
 * 1. Следуй комментариям `// ЗАДАНИЕ:`
 * 2. Пиши код в помеченных местах.
 * 3. Запусти файл, чтобы проверить результат (например, с помощью `ts-node src/game/either-exercise.ts`)
 */

import * as fs from "fs";
import * as E from "fp-ts/lib/Either.js";
import { pipe } from "fp-ts/lib/function.js";
import * as J from "fp-ts/lib/Json.js"; // Для безопасного парсинга JSON
import path from "path";
import * as D from "io-ts/lib/Decoder.js";

// =================================================================================
// ШАГ 1: Определяем интерфейс для настроек игры
// =================================================================================

// ЗАДАНИЕ: Определи интерфейс `GameSettings` на основе структуры `settings.json`.
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

// =================================================================================
// ШАГ 2: Безопасное чтение файла
// =================================================================================

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

/**
 * Читает содержимое файла. Возвращает Either<Error, string>.
 */
const readFileContent = (filePath: string): E.Either<ConfigErrors, string> => {
  // ЗАДАНИЕ: Используй try/catch и fs.readFileSync, чтобы безопасно прочитать файл.
  // В случае успеха верни `right(content)`, в случае ошибки - `left(error)`.
  // ТВОЙ КОД ЗДЕСЬ
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

// =================================================================================
// ШАГ 3: Безопасный парсинг JSON
// =================================================================================

/**
 * Парсит строку JSON. Возвращает Either<Error, unknown>.
 */

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

// =================================================================================
// ШАГ 4: Валидация типа
// =================================================================================

/**
 * Type guard для проверки, является ли объект GameSettings.
 */
const isGameSettings = (u: unknown): u is GameSettings => {
  // ЗАДАНИЕ: Реализуй проверку, что объект соответствует интерфейсу GameSettings.
  // Проверь наличие всех необходимых полей и их типы.
  // ТВОЙ КОД ЗДЕСЬ
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

/**
 * Валидирует объект, проверяя его соответствие интерфейсу GameSettings.
 * Возвращает Either<Error, GameSettings>.
 */
const validateGameSettings = (
  u: unknown
): E.Either<ConfigErrors, GameSettings> => {
  // ЗАДАНИЕ: Используй `isGameSettings` для валидации.
  // Если валидация успешна, верни `right(u as GameSettings)`.
  // В противном случае верни `left(new Error('Некорректная структура GameSettings'))`.
  // ТВОЙ КОД ЗДЕСЬ

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

// =================================================================================
// ШАГ 5: Композиция операций
// =================================================================================

/**
 * Читает, парсит и валидирует файл настроек игры.
 * Возвращает Either<Error, GameSettings>.
 */
export const readGameSettings = (
  filePath: string
): E.Either<ConfigErrors, GameSettings> => {
  // ЗАДАНИЕ: Используй `pipe` и `chain` для объединения `readFileContent`,
  // `parseJson` и `validateGameSettings`.
  // ТВОЙ КОД ЗДЕСЬ
  return pipe(
    readFileContent(filePath),
    E.chain(parseJson),
    E.chain(validateGameSettings)
  );
};

// =================================================================================
// ШАГ 6: Тестирование
// =================================================================================

console.log("--- Тестирование readGameSettings ---");

const settingsFilePath = "./src/game/settings.json";
const nonExistentFilePath = "./src/game/non-existent-settings.json";
const malformedJsonFilePath = "./src/game/malformed.json"; // Понадобится создать вручную для теста

// Пример успешного чтения
const successfulRead = readGameSettings(settingsFilePath);

pipe(
  successfulRead,
  E.match(
    (error) => {
      switch (error._tag) {
        case "ConfigNotFoundError":
          console.error("Файл не найден:", error.filePath);
          break;
        case "ConfigReadError":
          console.error(`Ошибка чтения: [${error.code}] ${error.message}`);
          break;
        case "JsonParseError":
          console.error(`JSON ошибка: ${error.message}`);
          break;
        case "ValidateConfigError":
          console.error(`Валидация: ${error.message}`);
          break;
      }
    },
    (settings) => console.log("Успешно прочитано (успешный путь):", settings)
  )
);

// Пример чтения несуществующего файла
const failedReadNonExistent = readGameSettings(nonExistentFilePath);
pipe(
  failedReadNonExistent,
  E.match(
    (error) => {
      if (error._tag === "ConfigNotFoundError") {
        console.error("Файл не найден:", error.filePath);
      }
    },
    () => console.error("Не должно произойти")
  )
);

// Пример чтения некорректного JSON (предполагает, что malformed.json существует)
// ЗАДАНИЕ: Создай файл `src/game/malformed.json` с некорректным JSON, например:
// `{ "rounds": 10, "carGeneration": { "minYear": 2000, }`

const failedReadMalformedJson = readGameSettings(malformedJsonFilePath);
pipe(
  failedReadMalformedJson,
  E.match(
    (err) => {
      if (err._tag === "JsonParseError") {
        console.error(err.message);
      }
    },
    (settings) => console.log("Успешно прочитано (корректный JSON):", settings)
  )
);

// Пример чтения JSON с некорректной структурой (создай settings_bad_structure.json)
// ЗАДАНИЕ: Создай файл `src/game/settings_bad_structure.json` с правильным JSON, но не по нашему интерфейсу, например:
// `{ "totalRounds": 10 }`

const badStructureFilePath = "./src/game/settings_bad_structure.json";
const failedReadBadStructure = readGameSettings(badStructureFilePath);

pipe(
  failedReadBadStructure,
  E.match(
    (error) => {
      if (error._tag === "ValidateConfigError") {
        console.log(console.error(error._tag));
      }
    },
    (settings) =>
      console.log("Успешно прочитано (некорректная структура):", settings)
  )
);
