export type SyncStatus = "synced" | "pending" | "deleted";

export type OutboxOp = "create" | "update" | "delete";

/**
 * Logical entity names used by the outbox and sync engine to route a queued
 * operation to the correct repository and remote service.
 */
export type EntityName =
  | "transaction"
  | "category"
  | "loan"
  | "investment"
  | "monthlyLimit"
  | "user";

/** Sync metadata columns present on every entity row. */
export interface SyncMeta {
  id: string;
  serverId: string | null;
  userId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
}

export interface OutboxItem {
  id: string;
  entity: EntityName;
  op: OutboxOp;
  localId: string;
  payload: string | null;
  createdAt: string;
  retryCount: number;
  lastError: string | null;
}
