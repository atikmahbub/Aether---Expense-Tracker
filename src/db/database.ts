import * as SQLite from "expo-sqlite";
import type { SQLiteDatabase } from "expo-sqlite";
import { runMigrations } from "@trackingPortal/db/migrations";

const DATABASE_NAME = "scalar.db";

let dbInstance: SQLiteDatabase | null = null;
let initPromise: Promise<SQLiteDatabase> | null = null;

/**
 * Opens the local SQLite database (once) and runs pending migrations. Safe to
 * call repeatedly and concurrently — the work is memoized so the DB is opened
 * and migrated a single time per app session.
 */
export async function initDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync("PRAGMA journal_mode = WAL;");
    await db.execAsync("PRAGMA foreign_keys = ON;");

    const version = await runMigrations(db);
    console.log(`📦 SQLite ready (${DATABASE_NAME}) at schema v${version}`);

    dbInstance = db;
    return db;
  })();

  try {
    return await initPromise;
  } catch (error) {
    // Allow a later retry if initialization failed.
    initPromise = null;
    throw error;
  }
}

/**
 * Returns the already-initialized database. Throws if {@link initDatabase} has
 * not completed yet — callers in the app tree should depend on the
 * `DatabaseProvider`'s `ready` flag rather than calling this before init.
 */
export function getDb(): SQLiteDatabase {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return dbInstance;
}
