import type { SQLiteDatabase } from "expo-sqlite";
import { Outbox } from "@trackingPortal/db/sync/Outbox";
import { TransactionRepository } from "@trackingPortal/db/repositories/TransactionRepository";
import { CategoryRepository } from "@trackingPortal/db/repositories/CategoryRepository";
import { LoanRepository } from "@trackingPortal/db/repositories/LoanRepository";
import { InvestRepository } from "@trackingPortal/db/repositories/InvestRepository";
import { MonthlyLimitRepository } from "@trackingPortal/db/repositories/MonthlyLimitRepository";
import { UserRepository } from "@trackingPortal/db/repositories/UserRepository";
import { SettingsRepository } from "@trackingPortal/db/repositories/SettingsRepository";

export * from "@trackingPortal/db/repositories/TransactionRepository";
export * from "@trackingPortal/db/repositories/CategoryRepository";
export * from "@trackingPortal/db/repositories/LoanRepository";
export * from "@trackingPortal/db/repositories/InvestRepository";
export * from "@trackingPortal/db/repositories/MonthlyLimitRepository";
export * from "@trackingPortal/db/repositories/UserRepository";
export * from "@trackingPortal/db/repositories/SettingsRepository";

export interface Repositories {
  transactions: TransactionRepository;
  categories: CategoryRepository;
  loans: LoanRepository;
  investments: InvestRepository;
  monthlyLimits: MonthlyLimitRepository;
  users: UserRepository;
  settings: SettingsRepository;
}

/** Builds the full set of repositories bound to a database + shared outbox. */
export function createRepositories(db: SQLiteDatabase, outbox: Outbox): Repositories {
  return {
    transactions: new TransactionRepository(db, outbox),
    categories: new CategoryRepository(db, outbox),
    loans: new LoanRepository(db, outbox),
    investments: new InvestRepository(db, outbox),
    monthlyLimits: new MonthlyLimitRepository(db, outbox),
    users: new UserRepository(db, outbox),
    settings: new SettingsRepository(db),
  };
}
