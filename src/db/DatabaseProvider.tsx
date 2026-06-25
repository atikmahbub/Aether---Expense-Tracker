import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { SQLiteDatabase } from "expo-sqlite";

import { apiGateway } from "@trackingPortal/api/apiGatewayInstance";
import { initDatabase } from "@trackingPortal/db/database";
import { Outbox } from "@trackingPortal/db/sync/Outbox";
import { SyncEngine } from "@trackingPortal/db/sync/SyncEngine";
import { TransactionDataService } from "@trackingPortal/db/services/TransactionDataService";
import { LoanDataService } from "@trackingPortal/db/services/LoanDataService";
import { InvestDataService } from "@trackingPortal/db/services/InvestDataService";
import { MonthlyLimitDataService } from "@trackingPortal/db/services/MonthlyLimitDataService";
import {
  createRepositories,
  Repositories,
} from "@trackingPortal/db/repositories";

interface DatabaseContextValue {
  /** True once the DB is open and migrations have run. */
  ready: boolean;
  db: SQLiteDatabase | null;
  repositories: Repositories | null;
  outbox: Outbox | null;
  syncEngine: SyncEngine | null;
  transactionData: TransactionDataService | null;
  loanData: LoanDataService | null;
  investData: InvestDataService | null;
  monthlyLimitData: MonthlyLimitDataService | null;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  ready: false,
  db: null,
  repositories: null,
  outbox: null,
  syncEngine: null,
  transactionData: null,
  loanData: null,
  investData: null,
  monthlyLimitData: null,
});

/**
 * Opens the local SQLite database, runs migrations, and constructs the
 * repositories + sync engine. Renders children immediately (never blocks the
 * UI) and flips `ready` once initialization completes.
 *
 * Must be mounted inside `StoreProvider` so it can build the `SyncEngine` from
 * the shared `apiGateway`. Phase 0: nothing in the UI consumes this yet.
 */
export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [value, setValue] = useState<DatabaseContextValue>({
    ready: false,
    db: null,
    repositories: null,
    outbox: null,
    syncEngine: null,
    transactionData: null,
    loanData: null,
    investData: null,
    monthlyLimitData: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await initDatabase();
        if (cancelled) return;
        const outbox = new Outbox(db);
        const repositories = createRepositories(db, outbox);
        const syncEngine = new SyncEngine(apiGateway, repositories, outbox);
        const transactionData = new TransactionDataService(repositories, syncEngine);
        const loanData = new LoanDataService(repositories);
        const investData = new InvestDataService(repositories);
        const monthlyLimitData = new MonthlyLimitDataService(repositories);
        setValue({
          ready: true,
          db,
          repositories,
          outbox,
          syncEngine,
          transactionData,
          loanData,
          investData,
          monthlyLimitData,
        });
      } catch (error) {
        console.error("Failed to initialize SQLite database", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextValue =>
  useContext(DatabaseContext);
