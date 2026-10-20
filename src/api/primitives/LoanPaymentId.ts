import { Brand, make } from "ts-brand";

export type LoanPaymentId = Brand<string, "LoanPaymentId">;
export const LoanPaymentId = make<LoanPaymentId>();
