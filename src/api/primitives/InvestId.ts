import { Brand, make } from "ts-brand";

export type InvestId = Brand<string, "InvestId">;
export const InvestId = make<InvestId>();
