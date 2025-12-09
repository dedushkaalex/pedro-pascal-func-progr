/**
 * Упражнение: Генерация случайных автомобилей
 *
 * Цель: Научиться генерировать случайные данные, используя `GameSettings`.
 *
 * Инструкция:
 * 1. Следуй комментариям `// ЗАДАНИЕ:` и заполни недостающий код.
 * 2. Для простоты используй `Math.random()`.
 * 3. Запусти файл, чтобы проверить результат (например, с помощью `ts-node src/game/exercise/car-generation-exercise.ts`)
 */

import { pipe } from "fp-ts/lib/function.js";
import * as E from "fp-ts/lib/Either.js";
import * as NEA from "fp-ts/lib/NonEmptyArray.js";
import { type GameSettings, readGameSettings } from "../settings.js";
import type { Brand, Engine, Car } from "../types.js";

// =================================================================================
// ШАГ 1: Вспомогательные функции для случайности
// =================================================================================

/**
 * Генерирует случайное целое число в диапазоне [min, max] (включительно).
 */
const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Выбирает случайный элемент из непустого массива.
 */
const getRandomElement = <A>(arr: NEA.NonEmptyArray<A>): A => {
  return arr[Math.floor(Math.random() * arr.length)] as A;
};

// =================================================================================
// ШАГ 2: Списки доступных марок и двигателей
// =================================================================================

// ЗАДАНИЕ: Создай непустые массивы (`NonEmptyArray`) для всех марок и двигателей.
export const allBrands: NEA.NonEmptyArray<Brand> = ["BMW", "Audi", "Ford"];
export const allEngines: NEA.NonEmptyArray<Engine> = [
  "diesel",
  "petrol",
  "electric",
];

// =================================================================================
// ШАГ 3: Функция для генерации автомобиля
// =================================================================================

/**
 * Генерирует один случайный автомобиль на основе настроек.
 */
export const generateCar = (settings: GameSettings): Car => {
  const { carGeneration } = settings;
  return {
    brand: getRandomElement(allBrands),
    engine: getRandomElement(allEngines),
    mileage: getRandomNumber(
      carGeneration.minMileage,
      carGeneration.maxMileage
    ),
    year: getRandomNumber(carGeneration.minYear, carGeneration.maxYear),
  };
};

// =================================================================================
// ШАГ 4: Тестирование
// =================================================================================

console.log("--- Тестирование generateCar ---");

// Читаем настройки
const settingsEither = readGameSettings("./src/game/settings.json");

pipe(
  settingsEither,
  E.match(
    (error) => console.error("Не удалось прочитать настройки:", error),
    (settings) => {
      try {
        console.log("Настройки успешно прочитаны. Генерируем 3 автомобиля:");
        const car1 = generateCar(settings);
        const car2 = generateCar(settings);
        const car3 = generateCar(settings);

        console.log("Автомобиль 1:", car1);
        console.log("Автомобиль 2:", car2);
        console.log("Автомобиль 3:", car3);
      } catch (e) {
        if (e instanceof Error) {
          console.error("Ошибка при генерации автомобиля:", e.message);
        }
      }
    }
  )
);
