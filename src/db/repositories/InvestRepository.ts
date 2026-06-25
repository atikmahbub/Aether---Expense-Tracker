import {
  BaseRepository,
  Row,
  ServerMapping,
} from "@trackingPortal/db/repositories/BaseRepository";
import type { EntityName } from "@trackingPortal/db/types";

export interface LocalInvest {
  id: string;
  serverId: string | null;
  userId: string | null;
  name: string;
  amount: number;
  note: string | null;
  startDate: string | null;
  endDate: string | null;
  status: number | null;
  earned: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  syncStatus: string;
}

export class InvestRepository extends BaseRepository<LocalInvest> {
  protected readonly table = "investments";
  protected readonly entity: EntityName = "investment";
  protected readonly entityColumns = [
    "name",
    "amount",
    "note",
    "startDate",
    "endDate",
    "status",
    "earned",
  ];

  protected toModel(row: Row): LocalInvest {
    return {
      id: row.id,
      serverId: row.serverId ?? null,
      userId: row.userId ?? null,
      name: row.name,
      amount: row.amount,
      note: row.note ?? null,
      startDate: row.startDate ?? null,
      endDate: row.endDate ?? null,
      status: row.status ?? null,
      earned: row.earned ?? null,
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
        name: model.name,
        amount: model.amount,
        note: model.note ?? null,
        startDate: model.startDate ?? null,
        endDate: model.endDate ?? null,
        status: model.status ?? null,
        earned: model.earned ?? null,
      },
    };
  }

  getByUser(userId: string) {
    return this.getAll("userId = ?", [userId]);
  }
}
