import { type Ord, contramap } from "fp-ts/lib/Ord.js";
import * as N from "fp-ts/lib/Number.js";
import type { Car, Brand, Engine } from "./types.js";
import { pipe } from "fp-ts/lib/function.js";
import { concatAll } from "fp-ts/lib/Monoid.js";

const brandToNumber = (brand: Brand): number => {
  const brandMap: Record<Brand, number> = {
    Ford: 1,
    Audi: 2,
    BMW: 3,
  };
  return brandMap[brand];
};

const engineToNumber = (engine: Engine): number => {
  const engineMap: Record<Engine, number> = {
    electric: 1,
    petrol: 2,
    diesel: 3,
  };
  return engineMap[engine];
};

// --- Коэффициенты и константы для оценки автомобиля ---

// Базовый год, от которого начинается отсчет. Машины старше этого года получат 0 очков за год.
const BASE_YEAR = 1990;
// Множитель очков за каждый год "свежести"
const YEAR_WEIGHT_MULTIPLIER = 1000;

// Условный "максимальный" пробег, от которого будем отнимать реальный
const MAX_MILEAGE_BENCHMARK = 500000;
// Делитель, чтобы уменьшить влияние пробега на итоговую оценку
const MILEAGE_WEIGHT_DIVISOR = 10;

// Множитель для повышения значимости бренда
const BRAND_WEIGHT_MULTIPLIER = 1000;
// Множитель для повышения значимости типа двигателя
const ENGINE_WEIGHT_MULTIPLIER = 500;

/**
 * Вычисляет "вес" (очки) для автомобиля, используя сбалансированные коэффициенты.
 */
const getCarWeight = (car: Car): number => {
  const yearWeight = Math.max(0, car.year - BASE_YEAR) * YEAR_WEIGHT_MULTIPLIER;

  const mileageWeight =
    Math.max(0, MAX_MILEAGE_BENCHMARK - car.mileage) / MILEAGE_WEIGHT_DIVISOR;

  const brandWeight = brandToNumber(car.brand) * BRAND_WEIGHT_MULTIPLIER;

  const engineWeight = engineToNumber(car.engine) * ENGINE_WEIGHT_MULTIPLIER;

  const weights = [yearWeight, mileageWeight, brandWeight, engineWeight];

  return concatAll(N.MonoidSum)(weights);
};

/**
 * Ord<Car>, который сравнивает машины по их "весу".
 */
export const ordCar: Ord<Car> = pipe(N.Ord, contramap(getCarWeight));
