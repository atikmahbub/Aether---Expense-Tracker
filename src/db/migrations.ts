import type { SQLiteDatabase } from "expo-sqlite";

/**
 * Ordered list of schema migrations. The DB's `PRAGMA user_version` tracks the
 * highest applied version; {@link runMigrations} applies any with a higher
 * version in order. Never edit a shipped migration — append a new one instead.
 */
export interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

/**
 * Columns shared by every entity table. These carry the sync metadata that the
 * sync engine relies on:
 *  - `id`          local primary key (a {@link newLocalId})
 *  - `serverId`    the Railway id once known (null until first successful push)
 *  - `createdAt` / `updatedAt`  ISO timestamps; `updatedAt` drives conflict resolution
 *  - `deletedAt`   set when soft-deleted locally
 *  - `syncStatus`  'synced' | 'pending' | 'deleted'
 *  - `lastSyncedAt` last time the row matched the server
 */
const SYNC_COLUMNS = `
  id TEXT PRIMARY KEY NOT NULL,
  serverId TEXT,
  userId TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  deletedAt TEXT,
  syncStatus TEXT NOT NULL DEFAULT 'synced',
  lastSyncedAt TEXT
`;

const v1: Migration = {
  version: 1,
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        ${SYNC_COLUMNS},
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        date TEXT,
        categoryId TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        ${SYNC_COLUMNS},
        kind TEXT NOT NULL,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT
      );

      CREATE TABLE IF NOT EXISTS loans (
        ${SYNC_COLUMNS},
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        deadLine TEXT,
        loanType INTEGER
      );

      CREATE TABLE IF NOT EXISTS investments (
        ${SYNC_COLUMNS},
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        startDate TEXT,
        endDate TEXT,
        status INTEGER,
        earned REAL
      );

      CREATE TABLE IF NOT EXISTS monthly_limits (
        ${SYNC_COLUMNS},
        month INTEGER,
        year INTEGER,
        "limit" REAL
      );

      CREATE TABLE IF NOT EXISTS users (
        ${SYNC_COLUMNS},
        name TEXT,
        email TEXT,
        profilePicture TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS outbox (
        id TEXT PRIMARY KEY NOT NULL,
        entity TEXT NOT NULL,
        op TEXT NOT NULL,
        localId TEXT NOT NULL,
        payload TEXT,
        createdAt TEXT NOT NULL,
        retryCount INTEGER NOT NULL DEFAULT 0,
        lastError TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date
        ON transactions (userId, type, date);
      CREATE INDEX IF NOT EXISTS idx_transactions_server ON transactions (serverId);
      CREATE INDEX IF NOT EXISTS idx_categories_server ON categories (serverId);
      CREATE INDEX IF NOT EXISTS idx_loans_server ON loans (serverId);
      CREATE INDEX IF NOT EXISTS idx_investments_server ON investments (serverId);
      CREATE INDEX IF NOT EXISTS idx_monthly_limits_server ON monthly_limits (serverId);
      CREATE INDEX IF NOT EXISTS idx_outbox_created ON outbox (createdAt);
    `);
  },
};

export const MIGRATIONS: Migration[] = [v1];

export const LATEST_VERSION = MIGRATIONS.reduce(
  (max, m) => Math.max(max, m.version),
  0,
);

/**
 * Applies any migrations newer than the DB's current `user_version`, in order,
 * then bumps `user_version`. Idempotent: safe to call on every launch.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  const current = row?.user_version ?? 0;

  const pending = MIGRATIONS.filter((m) => m.version > current).sort(
    (a, b) => a.version - b.version,
  );

  for (const migration of pending) {
    await migration.up(db);
    // PRAGMA does not accept bound parameters, so the version is interpolated.
    await db.execAsync(`PRAGMA user_version = ${migration.version}`);
  }

  return LATEST_VERSION;
}
