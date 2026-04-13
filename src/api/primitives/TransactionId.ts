import { Brand, make } from "ts-brand";

export type TransactionId = Brand<string, "TransactionId">;
export const TransactionId = make<TransactionId>();
