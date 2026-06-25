import type { SQLiteDatabase } from "expo-sqlite";
import { newLocalId } from "@trackingPortal/db/ids";
import type { Outbox } from "@trackingPortal/db/sync/Outbox";
import type { EntityName, SyncStatus } from "@trackingPortal/db/types";

/** A raw row as stored in SQLite (sync columns + entity columns). */
export type Row = Record<string, any>;

/**
 * Normalized result of mapping a server model into local storage:
 * the canonical `serverId` plus the column values to persist.
 */
export interface ServerMapping {
  serverId: string;
  userId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  /** Entity-specific column values (must match {@link BaseRepository.entityColumns}). */
  columns: Row;
}

const nowIso = () => new Date().toISOString();

/**
 * Generic, table-driven CRUD shared by every entity repository. Subclasses
 * declare their table, logical entity name, the entity-specific columns, and
 * the row<->model mappers; all sync-metadata bookkeeping and outbox enqueueing
 * lives here so it stays consistent across entities.
 */
export abstract class BaseRepository<TModel> {
  protected abstract readonly table: string;
  protected abstract readonly entity: EntityName;
  /** Entity columns excluding the shared sync metadata columns. */
  protected abstract readonly entityColumns: string[];

  /** Map a stored row to the domain model the app consumes. */
  protected abstract toModel(row: Row): TModel;
  /** Map a server model to the columns/metadata to persist locally. */
  protected abstract fromServer(model: any): ServerMapping;

  constructor(
    protected db: SQLiteDatabase,
    protected outbox: Outbox,
  ) {}

  private col(name: string): string {
    // `limit` is a reserved word; quote every entity column defensively.
    return `"${name}"`;
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  /**
   * Returns rows for the entity, excluding soft-deleted ones by default.
   * `where` is appended as an additional AND clause (without the keyword).
   */
  async getAll(where?: string, params: any[] = []): Promise<TModel[]> {
    const clause = where ? `AND ${where}` : "";
    const rows = await this.db.getAllAsync<Row>(
      `SELECT * FROM ${this.table} WHERE syncStatus != 'deleted' ${clause}`,
      params,
    );
    return rows.map((r) => this.toModel(r));
  }

  async getById(localId: string): Promise<TModel | null> {
    const row = await this.db.getFirstAsync<Row>(
      `SELECT * FROM ${this.table} WHERE id = ?`,
      [localId],
    );
    return row ? this.toModel(row) : null;
  }

  async getRowByServerId(serverId: string): Promise<Row | null> {
    return this.db.getFirstAsync<Row>(
      `SELECT * FROM ${this.table} WHERE serverId = ?`,
      [serverId],
    );
  }

  /** Local id for a given server id, if the row is known locally. */
  async localIdForServerId(serverId: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<{ id: string }>(
      `SELECT id FROM ${this.table} WHERE serverId = ?`,
      [serverId],
    );
    return row?.id ?? null;
  }

  /** Server id for a given local id, if it has been reconciled. */
  async serverIdForLocalId(localId: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<{ serverId: string | null }>(
      `SELECT serverId FROM ${this.table} WHERE id = ?`,
      [localId],
    );
    return row?.serverId ?? null;
  }

  /** All server ids currently stored for an entity (used for delete inference). */
  async knownServerIds(where?: string, params: any[] = []): Promise<string[]> {
    const clause = where ? `AND ${where}` : "";
    const rows = await this.db.getAllAsync<{ serverId: string }>(
      `SELECT serverId FROM ${this.table} WHERE serverId IS NOT NULL ${clause}`,
      params,
    );
    return rows.map((r) => r.serverId);
  }

  // ─── Local writes (UI-initiated) ───────────────────────────────────────────

  /**
   * Inserts a locally-created row (status `pending`) and enqueues a `create`
   * for the sync engine. Returns the new local id.
   */
  async insertLocal(
    columns: Row,
    meta: { userId?: string | null } = {},
  ): Promise<string> {
    const id = newLocalId();
    const ts = nowIso();
    const fullColumns: Row = {
      id,
      serverId: null,
      userId: meta.userId ?? null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
      syncStatus: "pending" as SyncStatus,
      lastSyncedAt: null,
      ...columns,
    };
    await this.insertRow(fullColumns);
    await this.outbox.enqueue({ entity: this.entity, op: "create", localId: id });
    return id;
  }

  /**
   * Applies a local edit (status `pending`) and enqueues an `update`. No-op
   * enqueue is avoided for rows that were never synced (still a pending create).
   */
  async updateLocal(localId: string, columns: Row): Promise<void> {
    const ts = nowIso();
    const existing = await this.db.getFirstAsync<Row>(
      `SELECT syncStatus, serverId FROM ${this.table} WHERE id = ?`,
      [localId],
    );
    const assignments = [
      ...Object.keys(columns).map((c) => `${this.col(c)} = ?`),
      "updatedAt = ?",
      "syncStatus = 'pending'",
    ].join(", ");
    await this.db.runAsync(
      `UPDATE ${this.table} SET ${assignments} WHERE id = ?`,
      [...Object.values(columns), ts, localId],
    );
    // If it already had a queued create, that create will carry the latest
    // columns at push time, so an extra update entry is unnecessary.
    if (existing?.serverId) {
      await this.outbox.enqueue({ entity: this.entity, op: "update", localId });
    }
  }

  /** Soft-deletes locally (status `deleted`) and enqueues a `delete`. */
  async softDelete(localId: string): Promise<void> {
    const ts = nowIso();
    const existing = await this.db.getFirstAsync<{ serverId: string | null }>(
      `SELECT serverId FROM ${this.table} WHERE id = ?`,
      [localId],
    );
    if (existing?.serverId) {
      await this.db.runAsync(
        `UPDATE ${this.table} SET deletedAt = ?, syncStatus = 'deleted', updatedAt = ? WHERE id = ?`,
        [ts, ts, localId],
      );
      await this.outbox.enqueue({ entity: this.entity, op: "delete", localId });
    } else {
      // Never synced — just drop it (and its pending create) locally.
      await this.db.runAsync(`DELETE FROM ${this.table} WHERE id = ?`, [localId]);
    }
  }

  // ─── Sync writes (server-initiated) ────────────────────────────────────────

  /**
   * Records the server id assigned to a freshly-created row and marks it synced.
   */
  async setServerId(
    localId: string,
    serverId: string,
    meta: { createdAt?: string | null; updatedAt?: string | null } = {},
  ): Promise<void> {
    await this.db.runAsync(
      `UPDATE ${this.table}
         SET serverId = ?, syncStatus = 'synced', lastSyncedAt = ?, createdAt = COALESCE(?, createdAt), updatedAt = COALESCE(?, updatedAt)
       WHERE id = ?`,
      [serverId, nowIso(), meta.createdAt ?? null, meta.updatedAt ?? null, localId],
    );
  }

  /** Marks an existing row as synced (after a successful update push). */
  async markSynced(localId: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE ${this.table} SET syncStatus = 'synced', lastSyncedAt = ? WHERE id = ?`,
      [nowIso(), localId],
    );
  }

  /** Hard-removes a row locally (after a delete has been confirmed on the server). */
  async purge(localId: string): Promise<void> {
    await this.db.runAsync(`DELETE FROM ${this.table} WHERE id = ?`, [localId]);
  }

  /** Soft-removes a row that no longer exists on the server (remote delete). */
  async markRemotelyDeleted(serverId: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE ${this.table} SET syncStatus = 'deleted', deletedAt = ? WHERE serverId = ?`,
      [nowIso(), serverId],
    );
  }

  /**
   * One-shot fix for rows pulled from the server without a userId (e.g. when
   * the API endpoint embeds userId in the URL path). Sets userId on any
   * synced row that currently has a null userId.
   */
  async backfillUserId(userId: string): Promise<void> {
    await this.db.runAsync(
      `UPDATE ${this.table} SET userId = ? WHERE userId IS NULL AND serverId IS NOT NULL`,
      [userId],
    );
  }

  /**
   * Merges a server model into SQLite. Inserts when unseen; on an existing row,
   * applies newest-`updatedAt`-wins so a local pending edit isn't clobbered by
   * older server state.
   */
  async upsertFromServer(model: any): Promise<void> {
    const mapping = this.fromServer(model);
    const existing = await this.getRowByServerId(mapping.serverId);
    const ts = nowIso();

    if (!existing) {
      await this.insertRow({
        id: newLocalId(),
        serverId: mapping.serverId,
        userId: mapping.userId ?? null,
        createdAt: mapping.createdAt ?? ts,
        updatedAt: mapping.updatedAt ?? ts,
        deletedAt: null,
        syncStatus: "synced" as SyncStatus,
        lastSyncedAt: ts,
        ...mapping.columns,
      });
      return;
    }

    if (existing.syncStatus === "pending" && this.serverIsOlder(existing, mapping)) {
      // Local edit is newer — keep it; sync engine will push it.
      return;
    }

    const assignments = [
      ...this.entityColumns.map((c) => `${this.col(c)} = ?`),
      "userId = ?",
      "createdAt = ?",
      "updatedAt = ?",
      "deletedAt = NULL",
      "syncStatus = 'synced'",
      "lastSyncedAt = ?",
    ].join(", ");
    const values = [
      ...this.entityColumns.map((c) => mapping.columns[c] ?? null),
      mapping.userId ?? existing.userId,
      mapping.createdAt ?? existing.createdAt,
      mapping.updatedAt ?? ts,
      ts,
    ];
    await this.db.runAsync(
      `UPDATE ${this.table} SET ${assignments} WHERE id = ?`,
      [...values, existing.id],
    );
  }

  /** True when the server's updatedAt is strictly older than the local row's. */
  private serverIsOlder(localRow: Row, mapping: ServerMapping): boolean {
    const localTs = Date.parse(localRow.updatedAt ?? "") || 0;
    const serverTs = Date.parse(mapping.updatedAt ?? "") || 0;
    return serverTs < localTs;
  }

  private async insertRow(row: Row): Promise<void> {
    const columns = Object.keys(row);
    const placeholders = columns.map(() => "?").join(", ");
    const quoted = columns.map((c) => this.col(c)).join(", ");
    await this.db.runAsync(
      `INSERT OR REPLACE INTO ${this.table} (${quoted}) VALUES (${placeholders})`,
      Object.values(row),
    );
  }
}
