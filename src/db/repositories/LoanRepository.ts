import {
  BaseRepository,
  Row,
  ServerMapping,
} from "@trackingPortal/db/repositories/BaseRepository";
import type { EntityName } from "@trackingPortal/db/types";

export interface LocalLoan {
  id: string;
  serverId: string | null;
  userId: string | null;
  name: string;
  amount: number;
  note: string | null;
  deadLine: string | null;
  loanType: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  syncStatus: string;
}

export class LoanRepository extends BaseRepository<LocalLoan> {
  protected readonly table = "loans";
  protected readonly entity: EntityName = "loan";
  protected readonly entityColumns = ["name", "amount", "note", "deadLine", "loanType"];

  protected toModel(row: Row): LocalLoan {
    return {
      id: row.id,
      serverId: row.serverId ?? null,
      userId: row.userId ?? null,
      name: row.name,
      amount: row.amount,
      note: row.note ?? null,
      deadLine: row.deadLine ?? null,
      loanType: row.loanType ?? null,
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
        deadLine: model.deadLine ?? null,
        loanType: model.loanType ?? null,
      },
    };
  }

  getByUser(userId: string) {
    return this.getAll("userId = ?", [userId]);
  }
}
