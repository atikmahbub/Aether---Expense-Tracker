import {
  BaseRepository,
  Row,
  ServerMapping,
} from "@trackingPortal/db/repositories/BaseRepository";
import type { EntityName } from "@trackingPortal/db/types";

export interface LocalMonthlyLimit {
  id: string;
  serverId: string | null;
  userId: string | null;
  month: number | null;
  year: number | null;
  limit: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  syncStatus: string;
}

export class MonthlyLimitRepository extends BaseRepository<LocalMonthlyLimit> {
  protected readonly table = "monthly_limits";
  protected readonly entity: EntityName = "monthlyLimit";
  protected readonly entityColumns = ["month", "year", "limit"];

  protected toModel(row: Row): LocalMonthlyLimit {
    return {
      id: row.id,
      serverId: row.serverId ?? null,
      userId: row.userId ?? null,
      month: row.month ?? null,
      year: row.year ?? null,
      limit: row.limit ?? null,
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
        month: model.month ?? null,
        year: model.year ?? null,
        limit: model.limit ?? null,
      },
    };
  }

  getByUser(userId: string) {
    return this.getAll("userId = ?", [userId]);
  }
}
