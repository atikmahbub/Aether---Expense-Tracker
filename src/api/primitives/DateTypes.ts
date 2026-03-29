import { Brand } from "ts-brand";

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type Year = Brand<number, "Year">;

export function makeYear(value: number): Year {
  const currentYear = new Date().getFullYear();
  if (value < 1900 || value > currentYear + 10) {
    throw new Error(`Year must be between 1900 and ${currentYear + 10}`);
  }
  return value as Year;
}
