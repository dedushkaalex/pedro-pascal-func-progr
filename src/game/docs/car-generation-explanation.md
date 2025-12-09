# Конспект: Генерация случайных данных для игры

## 1. Случайность в функциональном программировании

В чистом функциональном программировании функции должны быть **чистыми** (pure): для одних и тех же входных данных они всегда должны возвращать один и тот же результат, не вызывая побочных эффектов. `Math.random()` нарушает это правило, так как при каждом вызове возвращает новое значение.

Для нашей игры мы можем использовать `Math.random()` напрямую, если не стремимся к полной чистоте в каждом уголке кода прямо сейчас. Это самый простой подход. Если бы мы хотели полной чистоты, `fp-ts` предоставляет такие типы, как `IO` или `State`, которые позволяют инкапсулировать побочные эффекты. Для простоты сейчас будем использовать `Math.random()`.

## 2. Генерация случайного числа в диапазоне

Для генерации целого числа в диапазоне `[min, max]` (включительно) можно использовать следующую формулу:

```typescript
const getRandomNumber = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
```

Это пригодится для года выпуска и пробега автомобиля.

## 3. Выбор случайного элемента из массива

Чтобы выбрать случайный элемент из заданного массива, мы можем использовать:

```typescript
import { NonEmptyArray } from 'fp-ts/NonEmptyArray';

const getRandomElement = <A>(arr: ReadonlyArray<A>): A => {
  if (arr.length === 0) {
    throw new Error("Массив не должен быть пустым"); // Или обработать ошибку по-другому
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
};

// Если мы используем NonEmptyArray, мы гарантированы, что он не пустой
const getRandomNonEmptyElement = <A>(arr: NonEmptyArray<A>): A => {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
};
```

Использование `NonEmptyArray` из `fp-ts` является хорошей практикой, так как оно дает типовую гарантию того, что массив не пуст, и нам не нужно проверять `arr.length === 0`.

## 4. Списки доступных значений

Для марок (`Brand`) и двигателей (`Engine`) у нас есть предопределенные списки в `types.ts`. Мы можем создать массивы этих значений:

```typescript
import { Brand, Engine } from '../types';
import * as NEA from 'fp-ts/NonEmptyArray';

export const allBrands: NEA.NonEmptyArray<Brand> = ['BMW', 'Audi', 'Ford'];
export const allEngines: NEA.NonEmptyArray<Engine> = ['diesel', 'petrol', 'electric'];
```

## 5. Композиция для генерации `Car`

Для генерации автомобиля нам нужно будет объединить эти подходы:
- Прочитать `GameSettings` (используя `readGameSettings` из `settings.ts`).
- Использовать `carGeneration.minYear` и `carGeneration.maxYear` для генерации года.
- Использовать `carGeneration.minMileage` и `carGeneration.maxMileage` для генерации пробега.
- Случайно выбрать `Brand` из `allBrands`.
- Случайно выбрать `Engine` из `allEngines`.

На выходе мы получим случайный объект типа `Car`.

В следующем упражнении мы это реализуем!
