import type { SQLiteDatabase } from "expo-sqlite";

/**
 * Simple local key/value store for user settings and small caches (currency
 * preference, recent categories, etc.). Not an entity table — it has no sync
 * metadata and is not pushed to the server here.
 */
export class SettingsRepository {
  constructor(private db: SQLiteDatabase) {}

  async get(key: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      [key],
    );
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [key, value],
    );
  }

  async remove(key: string): Promise<void> {
    await this.db.runAsync("DELETE FROM settings WHERE key = ?", [key]);
  }
}
