import type { SQLiteDatabase } from "expo-sqlite";
import { newLocalId } from "@trackingPortal/db/ids";
import type { EntityName, OutboxItem, OutboxOp } from "@trackingPortal/db/types";

/**
 * Durable, table-backed queue of pending writes (creates / updates / deletes)
 * that still need to be pushed to Railway. This is the SQLite replacement for
 * the legacy AsyncStorage queue in `src/api/utils/OfflineService.ts`.
 *
 * Items are drained in FIFO (createdAt) order by {@link SyncEngine.push}.
 */
export class Outbox {
  constructor(private db: SQLiteDatabase) {}

  async enqueue(params: {
    entity: EntityName;
    op: OutboxOp;
    localId: string;
    payload?: unknown;
  }): Promise<OutboxItem> {
    const item: OutboxItem = {
      id: newLocalId(),
      entity: params.entity,
      op: params.op,
      localId: params.localId,
      payload: params.payload != null ? JSON.stringify(params.payload) : null,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      lastError: null,
    };

    await this.db.runAsync(
      `INSERT INTO outbox (id, entity, op, localId, payload, createdAt, retryCount, lastError)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.entity,
        item.op,
        item.localId,
        item.payload,
        item.createdAt,
        item.retryCount,
        item.lastError,
      ],
    );

    return item;
  }

  /** Max push attempts before an item is parked (kept, but no longer retried). */
  static readonly MAX_RETRIES = 5;

  /** Pending items oldest-first, excluding items that have exhausted retries. */
  async peekPending(): Promise<OutboxItem[]> {
    return this.db.getAllAsync<OutboxItem>(
      "SELECT * FROM outbox WHERE retryCount < ? ORDER BY createdAt ASC",
      [Outbox.MAX_RETRIES],
    );
  }

  /** Count of items still eligible for a sync attempt (drives the banner). */
  async count(): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) AS n FROM outbox WHERE retryCount < ?",
      [Outbox.MAX_RETRIES],
    );
    return row?.n ?? 0;
  }

  async markDone(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM outbox WHERE id = ?", [id]);
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.db.runAsync(
      "UPDATE outbox SET retryCount = retryCount + 1, lastError = ? WHERE id = ?",
      [error, id],
    );
  }
}
