import {
  BaseRepository,
  Row,
  ServerMapping,
} from "@trackingPortal/db/repositories/BaseRepository";
import type { EntityName } from "@trackingPortal/db/types";
import type { RecurringFrequency } from "@trackingPortal/api/models/RecurringRuleModel";

export interface LocalRecurringRule {
  id: string;
  serverId: string | null;
  userId: string | null;
  type: "expense" | "income";
  amount: number;
  description: string | null;
  categoryId: string | null;
  frequency: RecurringFrequency;
  /** Seconds UnixTimeStampString; also the anchor every occurrence is counted from. */
  startDate: string;
  endDate: string | null;
  pausedAt: string | null;
  lastRunDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  syncStatus: string;
}

export class RecurringRuleRepository extends BaseRepository<LocalRecurringRule> {
  protected readonly table = "recurring_rules";
  protected readonly entity: EntityName = "recurringRule";
  protected readonly entityColumns = [
    "type",
    "amount",
    "description",
    "categoryId",
    "frequency",
    "startDate",
    "endDate",
    "pausedAt",
    "lastRunDate",
  ];

  protected toModel(row: Row): LocalRecurringRule {
    return {
      id: row.id,
      serverId: row.serverId ?? null,
      userId: row.userId ?? null,
      type: row.type,
      amount: row.amount,
      description: row.description ?? null,
      categoryId: row.categoryId ?? null,
      frequency: row.frequency,
      startDate: row.startDate,
      endDate: row.endDate ?? null,
      pausedAt: row.pausedAt ?? null,
      lastRunDate: row.lastRunDate ?? null,
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
        categoryId: model.categoryId != null ? String(model.categoryId) : null,
        frequency: model.frequency,
        startDate: String(model.startDate),
        endDate: model.endDate != null ? String(model.endDate) : null,
        pausedAt: model.pausedAt != null ? String(model.pausedAt) : null,
        lastRunDate: model.lastRunDate != null ? String(model.lastRunDate) : null,
      },
    };
  }

  getByUser(userId: string) {
    return this.getAll("userId = ?", [userId]);
  }
}
