import { Brand, make } from "ts-brand";

export type ExpenseId = Brand<string, "ExpenseId">;
export const ExpenseId = make<ExpenseId>();
