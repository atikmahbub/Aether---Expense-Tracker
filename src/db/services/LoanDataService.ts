import type { LoanModel } from "@trackingPortal/api/models";
import type { LoanType } from "@trackingPortal/api/enums";
import {
  LoanId,
  UserId,
  makeUnixTimestampString,
} from "@trackingPortal/api/primitives";
import type { Repositories } from "@trackingPortal/db/repositories";
import type { LocalLoan } from "@trackingPortal/db/repositories/LoanRepository";

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
    },
  ): Promise<void> {
    const columns: Record<string, any> = {};
    if (patch.name !== undefined) columns.name = patch.name;
    if (patch.amount !== undefined) columns.amount = patch.amount;
    if (patch.note !== undefined) columns.note = patch.note;
    if (patch.deadLine !== undefined) columns.deadLine = patch.deadLine;
    await this.repos.loans.updateLocal(localId, columns);
  }

  async deleteLoan(localId: string): Promise<void> {
    await this.repos.loans.softDelete(localId);
  }
}
