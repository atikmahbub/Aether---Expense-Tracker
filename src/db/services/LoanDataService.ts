import type { LoanModel } from "@trackingPortal/api/models";
import type { LoanType } from "@trackingPortal/api/enums";
import {
  LoanId,
  UserId,
  makeUnixTimestampString,
} from "@trackingPortal/api/primitives";
import type { Repositories } from "@trackingPortal/db/repositories";
import type { LocalLoan } from "@trackingPortal/db/repositories/LoanRepository";
import type { LocalLoanPayment } from "@trackingPortal/db/repositories/LoanPaymentRepository";

/** A repayment as the loan screens consume it. */
export interface LoanPaymentView {
  id: string;
  /** Always the local loan id, whether the payment was logged here or pulled. */
  loanId: string;
  amount: number;
  date: string; // seconds UnixTimeStampString
  note: string | null;
}

export interface CreateLoanPaymentInput {
  userId: string;
  loanId: string; // local loan id
  amount: number;
  date: string; // seconds UnixTimeStampString
  note: string | null;
}

const nowSeconds = () => String(Math.floor(Date.now() / 1000));

export interface CreateLoanInput {
  userId: string;
  name: string;
  amount: number;
  note: string | null;
  deadLine: string; // seconds UnixTimeStampString
  loanType: LoanType;
}

/**
 * SQLite-backed read/write API for loans — the offline-first replacement for the
 * loan endpoints. Screens read through this; writes go to SQLite + the outbox.
 */
export class LoanDataService {
  constructor(private repos: Repositories) {}

  private toModel(row: LocalLoan): LoanModel {
    return {
      id: row.id as unknown as LoanId,
      userId: (row.userId ?? "") as UserId,
      name: row.name,
      amount: row.amount,
      note: row.note,
      deadLine: (row.deadLine ?? "") as any,
      loanType: row.loanType as unknown as LoanType,
      settledAt: (row.settledAt ?? null) as any,
      created: (row.createdAt ?? makeUnixTimestampString(0)) as any,
      updated: (row.updatedAt ?? makeUnixTimestampString(0)) as any,
    };
  }

  async getLoans(userId: string): Promise<LoanModel[]> {
    const rows = (await this.repos.loans.getByUser(userId)) as LocalLoan[];
    return rows.map((r) => this.toModel(r));
  }

  async createLoan(input: CreateLoanInput): Promise<LoanModel> {
    const id = await this.repos.loans.insertLocal(
      {
        name: input.name,
        amount: input.amount,
        note: input.note,
        deadLine: input.deadLine,
        loanType: input.loanType,
      },
      { userId: input.userId },
    );
    const row = (await this.repos.loans.getById(id)) as LocalLoan;
    return this.toModel(row);
  }

  async updateLoan(
    localId: string,
    patch: {
      name?: string;
      amount?: number;
      note?: string | null;
      deadLine?: string;
      loanType?: number;
    },
  ): Promise<void> {
    const columns: Record<string, any> = {};
    if (patch.name !== undefined) columns.name = patch.name;
    if (patch.amount !== undefined) columns.amount = patch.amount;
    if (patch.note !== undefined) columns.note = patch.note;
    if (patch.deadLine !== undefined) columns.deadLine = patch.deadLine;
    if (patch.loanType !== undefined) columns.loanType = patch.loanType;
    await this.repos.loans.updateLocal(localId, columns);
  }

  async deleteLoan(localId: string): Promise<void> {
    const serverId = await this.repos.loans.serverIdForLocalId(localId);
    await this.repos.loans.softDelete(localId);
    await this.repos.loanPayments.purgeForLoan([localId, serverId ?? ""]);
  }

  async settleLoan(localId: string): Promise<void> {
    await this.repos.loans.updateLocal(localId, { settledAt: nowSeconds() });
  }

  async reopenLoan(localId: string): Promise<void> {
    await this.repos.loans.updateLocal(localId, { settledAt: null });
  }

  // ─── Payments ──────────────────────────────────────────────────────────────

  async getPayments(userId: string): Promise<LoanPaymentView[]> {
    const loans = (await this.repos.loans.getByUser(userId)) as LocalLoan[];
    const localIdFor: Record<string, string> = {};
    for (const loan of loans) {
      localIdFor[loan.id] = loan.id;
      if (loan.serverId) localIdFor[loan.serverId] = loan.id;
    }
    const rows = (await this.repos.loanPayments.getByUser(
      userId,
    )) as LocalLoanPayment[];
    return rows
      .filter((r) => localIdFor[r.loanId])
      .map((r) => ({
        id: r.id,
        loanId: localIdFor[r.loanId],
        amount: r.amount,
        date: r.date ?? "",
        note: r.note,
      }))
      .sort((a, b) => Number(b.date) - Number(a.date));
  }

  /**
   * Logs a repayment and settles the loan once nothing is left on it. The
   * caller caps the amount at what remains; settlement is decided here, on
   * the device, so offline writes never conflict with the server.
   */
  async addPayment(input: CreateLoanPaymentInput): Promise<void> {
    await this.repos.loanPayments.insertLocal(
      {
        loanId: input.loanId,
        amount: input.amount,
        date: input.date,
        note: input.note,
      },
      { userId: input.userId },
    );
    const loan = (await this.repos.loans.getById(input.loanId)) as LocalLoan | null;
    if (!loan || loan.settledAt) return;
    const paid = (await this.getPayments(input.userId))
      .filter((p) => p.loanId === input.loanId)
      .reduce((sum, p) => sum + p.amount, 0);
    // Compare in cents so float sums like 0.1 + 0.2 still settle.
    if (Math.round(paid * 100) >= Math.round(loan.amount * 100)) {
      await this.settleLoan(input.loanId);
    }
  }

  async deletePayment(localId: string): Promise<void> {
    await this.repos.loanPayments.softDelete(localId);
  }
}
