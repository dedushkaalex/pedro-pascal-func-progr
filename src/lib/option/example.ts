import { pipe } from "fp-ts/lib/function.js";
import * as O from 'fp-ts/lib/Option.js'

type Car = {
  brand: string;
  year: number;
  engine: "diesel" | "petrol" | "electric";
  mileage: number;
};

type None = {
  readonly _tag: "None";
};

type Some<A> = {
  readonly _tag: "Some";
  readonly value: A;
};

type Option<A> = Some<A> | None;

const none: Option<never> = { _tag: "None" };
const some = <A>(value: A): Option<A> => ({ _tag: "Some", value });

const isNone = <A>(o: Option<A>): o is None => o._tag === "None"
const isSome= <A>(o: Option<A>): o is Some<A> => o._tag === "Some"

const mapOption = <A, B>(fn: (value: A) => B) => (option: Option<A>): Option<B> => {
  if (isNone(option)) {
    return none;
  }

  return some(fn(option.value))
}

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

// 🔴 BAD
// function findCarByBrand(cars: Car[], brand: string): Car | undefined {
//   return cars.find(c => c.brand === brand);
// }
// const car = findCarByBrand(cars, "Mercedes");
// car может быть undefined!
// console.log(car.year); // 💥 Runtime Error: Cannot read property 'year' of undefined

// 🟢 GOOD

// function findCarByBrand(cars: Car[], brand: string): Option<Car> {
//   const car = cars.find(c => c.brand === brand);

//   return car ? some(car) : none;
// }


// const maybeCar = findCarByBrand(cars, "BhMW");
// const maybeYear = mapOption((car: Car) => car.year)(maybeCar);
// console.log(maybeYear)

// const maybeYear2 = pipe(
//   findCarByBrand(cars, "BMW"),
//   mapOption((car) => car.year),
//   mapOption((year) => year + 1)  // можно цепочкой!
// );

// console.log(maybeYear2)


// const findCarByBrand = (cars: Car[], brand: string): O.Option<Car> => O.fromNullable(cars.find(c => c.brand === brand));

// const result = pipe(
//   findCarByBrand(cars, "BMW"),
//   O.map((car) => car.year),        // Some(2018)
//   O.map((year) => `Year: ${year}`), // Some("Year: 2018")
//   O.getOrElseW(() => null) // извлекаем значение
// );
// console.log(result); // "Year: 2018"

// 1. Напиши функцию getCarYear, которая:
//    - принимает массив машин и бренд
//    - возвращает Option<number> с годом первой найденной машины

// 2. Напиши функцию getOldestCarBrand, которая:
//    - принимает массив машин
//    - находит машину с минимальным годом
//    - возвращает Option<string> с брендом

// 3. Напиши функцию formatFoundCar, которая:
//    - принимает Option<Car>
//    - возвращает строку: либо форматированную машину, либо "Not found"

const getCarYear = (brand: string) => (cars: Car[]): Option<number> => {
  const car = cars.find((c) => c.brand === brand);
  if (car) {
    return O.some(car.year)
  }
  return O.none
}

// const getCarYear2
