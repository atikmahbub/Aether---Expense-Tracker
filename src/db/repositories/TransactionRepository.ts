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
  categoryName: string | null;
  /** Local id of the recurring rule that generated this entry, if any. */
  recurringRuleId: string | null;
  occurrenceDate: string | null;
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
    "categoryName",
    "recurringRuleId",
    "occurrenceDate",
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
      categoryName: row.categoryName ?? null,
      recurringRuleId: row.recurringRuleId ?? null,
      occurrenceDate: row.occurrenceDate ?? null,
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
        categoryId:
          model.categoryId != null
            ? String(model.categoryId)
            : model.category?.id != null
              ? String(model.category.id)
              : null,
        categoryName: model.categoryName ?? model.category?.name ?? null,
        // A pulled entry names its rule by server id; readers match either id.
        recurringRuleId:
          model.recurringRuleId != null ? String(model.recurringRuleId) : null,
        occurrenceDate:
          model.occurrenceDate != null ? String(model.occurrenceDate) : null,
      },
    };
  }

  getByUserAndType(userId: string, type: "expense" | "income") {
    return this.getAll("userId = ? AND type = ?", [userId, type]);
  }

  /**
   * Income and expense sums per local month, in one grouped query. `date` is
   * a unix timestamp string in seconds or milliseconds (see parseDate);
   * `offsetSeconds` shifts it to the local zone before taking the month.
   */
  async monthlySums(
    userId: string,
    offsetSeconds: number,
  ): Promise<{ month: string; type: "expense" | "income"; total: number }[]> {
    return this.db.getAllAsync(
      `SELECT strftime('%Y-%m',
                (CASE WHEN CAST(date AS REAL) < 1e12
                      THEN CAST(date AS REAL)
                      ELSE CAST(date AS REAL) / 1000 END) + ?,
                'unixepoch') AS month,
              type,
              SUM(amount) AS total
         FROM transactions
        WHERE syncStatus != 'deleted' AND userId = ?
          AND date IS NOT NULL AND date != ''
        GROUP BY month, type`,
      [offsetSeconds, userId],
    );
  }
}
