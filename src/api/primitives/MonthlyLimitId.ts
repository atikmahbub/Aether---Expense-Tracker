import { make, Brand } from "ts-brand";

export type MonthlyLimitId = Brand<string, "MonthlyLimitId">;

export const MonthlyLimitId = make<MonthlyLimitId>();
