import {
  BaseRepository,
  Row,
  ServerMapping,
} from "@trackingPortal/db/repositories/BaseRepository";
import type { EntityName } from "@trackingPortal/db/types";

export interface LocalLoanPayment {
  id: string;
  serverId: string | null;
  userId: string | null;
  /** Local loan id when logged offline, the server loan id when pulled. */
  loanId: string;
  amount: number;
  date: string | null;
  note: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  syncStatus: string;
}

export class LoanPaymentRepository extends BaseRepository<LocalLoanPayment> {
  protected readonly table = "loan_payments";
  protected readonly entity: EntityName = "loanPayment";
  protected readonly entityColumns = ["loanId", "amount", "date", "note"];

  protected toModel(row: Row): LocalLoanPayment {
    return {
      id: row.id,
      serverId: row.serverId ?? null,
      userId: row.userId ?? null,
      loanId: row.loanId,
      amount: row.amount,
      date: row.date ?? null,
      note: row.note ?? null,
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
        loanId: String(model.loanId),
        amount: model.amount,
        date: model.date ?? null,
        note: model.note ?? null,
      },
    };
  }

  getByUser(userId: string) {
    return this.getAll("userId = ?", [userId]);
  }

  /**
   * Drops a deleted loan's payments locally without queueing deletes: the
   * server cascades them when the loan delete lands, and unsynced ones never
   * reached it.
   */
  async purgeForLoan(loanIds: string[]): Promise<void> {
    const ids = loanIds.filter(Boolean);
    if (!ids.length) return;
    const placeholders = ids.map(() => "?").join(", ");
    await this.db.runAsync(
      `DELETE FROM ${this.table} WHERE loanId IN (${placeholders})`,
      ids,
    );
  }
}
