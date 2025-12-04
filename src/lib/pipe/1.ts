import { flow } from "fp-ts/lib/function.js";
import * as A from "fp-ts/lib/Array.js";

// Задание: создайте цепочку функций для форматирования вывода автомобиля
type Car = {
  brand: string;
  year: number;
  engine: "diesel" | "petrol" | "electric";
  mileage: number;
};

const formatCar = (car: Car) =>
  `${car.brand} ${car.year} (${car.engine}) -  ${car.mileage} km`;

const isBMW = (car: Car) => car.brand === "BMW";

const getResultCar = flow(
  A.filter(isBMW),
  A.map(formatCar),
  (cars) => cars.join("\n")
);

const cars: Car[] = [
  {
    brand: "BMW",
    year: 2018,
    engine: "diesel",
    mileage: 45000,
  },
  {
    brand: "AUDI",
    year: 2018,
    engine: "petrol",
    mileage: 45000,
  },
  {
    brand: "BMW",
    year: 2013,
    engine: "diesel",
    mileage: 23000,
  },
  {
    brand: "AUDI",
    year: 2018,
    engine: "petrol",
    mileage: 45000,
  },
];

console.log(getResultCar(cars));
