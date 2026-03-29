import { Brand, make } from "ts-brand";

export type UserId = Brand<string, "UserId">;
export const UserId = make<UserId>();
