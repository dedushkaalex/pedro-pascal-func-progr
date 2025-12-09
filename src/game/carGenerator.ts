import * as NEA from "fp-ts/lib/NonEmptyArray.js";
import { type GameSettings } from "./settings.js";
import type { Brand, Engine, Car } from "./types.js";

const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const getRandomElement = <A>(arr: NEA.NonEmptyArray<A>): A => {
  return arr[Math.floor(Math.random() * arr.length)] as A;
};

export const allBrands: NEA.NonEmptyArray<Brand> = ["BMW", "Audi", "Ford"];
export const allEngines: NEA.NonEmptyArray<Engine> = [
  "diesel",
  "petrol",
  "electric",
];

export const generateCar = (settings: GameSettings): Car => {
  const brand = getRandomElement(allBrands);
  const engine = getRandomElement(allEngines);
  const year = getRandomNumber(
    settings.carGeneration.minYear,
    settings.carGeneration.maxYear
  );
  const mileage = getRandomNumber(
    settings.carGeneration.minMileage,
    settings.carGeneration.maxMileage
  );

  return {
    brand,
    engine,
    year,
    mileage,
  };
};
