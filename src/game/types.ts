export type Brand = "BMW" | "Audi" | "Ford";

export type Engine = "diesel" | "petrol" | "electric";

export interface Car {
  brand: Brand;
  engine: Engine;
  year: number;
  mileage: number;
}
