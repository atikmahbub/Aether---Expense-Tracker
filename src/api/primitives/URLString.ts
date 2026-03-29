import { make, Brand } from "ts-brand";

export type URLString = Brand<string, "URLString">;
export const URLString = make<URLString>();
