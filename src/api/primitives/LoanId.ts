import { Brand, make } from "ts-brand";

export type LoanId = Brand<string, "LoanId">;
export const LoanId = make<LoanId>();
