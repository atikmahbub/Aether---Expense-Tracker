import {
  BaseRepository,
  Row,
  ServerMapping,
} from "@trackingPortal/db/repositories/BaseRepository";
import type { EntityName } from "@trackingPortal/db/types";

export interface LocalTransaction {
  id: string;
  serverId: string | null;
  userId: string | null;
  type: "expense" | "income";
  amount: number;
  description: string | null;
  date: string | null;
  categoryId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  syncStatus: string;
}

/**
 * Expense + income rows live in one `transactions` table, distinguished by
 * `type`. The sync engine feeds server models tagged with their `type` (the
 * REST API splits the two into separate endpoints).
 */
export class TransactionRepository extends BaseRepository<LocalTransaction> {
  protected readonly table = "transactions";
  protected readonly entity: EntityName = "transaction";
  protected readonly entityColumns = [
    "type",
    "amount",
    "description",
    "date",
    "categoryId",
  ];

  protected toModel(row: Row): LocalTransaction {
    return {
      id: row.id,
      serverId: row.serverId ?? null,
      userId: row.userId ?? null,
      type: row.type,
      amount: row.amount,
      description: row.description ?? null,
      date: row.date ?? null,
      categoryId: row.categoryId ?? null,
      createdAt: row.createdAt ?? null,
      updatedAt: row.updatedAt ?? null,
      syncStatus: row.syncStatus,
    };
  }

  protected fromServer(model: any): ServerMapping {
    return {
      serverId: String(model.id),
      userId: model.userId != null ? String(model.userId) : null,
      createdAt: model.created ?? null,
      updatedAt: model.updated ?? null,
      columns: {
        type: model.type,
        amount: model.amount,
        description: model.description ?? null,
        date: model.date ?? null,
        categoryId: model.categoryId != null ? String(model.categoryId) : null,
      },
    };
  }

  getByUserAndType(userId: string, type: "expense" | "income") {
    return this.getAll("userId = ? AND type = ?", [userId, type]);
  }
}
