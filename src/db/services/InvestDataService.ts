import type { InvestModel } from "@trackingPortal/api/models";
import { EInvestStatus } from "@trackingPortal/api/enums";
import { InvestId, makeUnixTimestampString } from "@trackingPortal/api/primitives";
import type { Repositories } from "@trackingPortal/db/repositories";
import type { LocalInvest } from "@trackingPortal/db/repositories/InvestRepository";

export interface CreateInvestInput {
  userId: string;
  name: string;
  amount: number;
  note: string;
  startDate: string; // seconds UnixTimeStampString
}

/**
 * SQLite-backed read/write API for investments — the offline-first replacement
 * for the invest endpoints. Screens read through this; writes go to SQLite +
 * the outbox.
 */
export class InvestDataService {
  constructor(private repos: Repositories) {}

  private toModel(row: LocalInvest): InvestModel {
    return {
      id: row.id as unknown as InvestId,
      name: row.name,
      amount: row.amount,
      note: row.note ?? "",
      startDate: (row.startDate ?? "") as any,
      endDate: (row.endDate ?? null) as any,
      status: (row.status ?? EInvestStatus.Active) as EInvestStatus,
      earned: row.earned ?? 0,
      created: (row.createdAt ?? makeUnixTimestampString(0)) as any,
      updated: (row.updatedAt ?? makeUnixTimestampString(0)) as any,
    };
  }

  /** Investments for a user, filtered by status (Active / Completed). */
  async getInvests(userId: string, status: EInvestStatus): Promise<InvestModel[]> {
    const rows = (await this.repos.investments.getByUser(userId)) as LocalInvest[];
    return rows
      .filter((r) => (r.status ?? EInvestStatus.Active) === status)
      .map((r) => this.toModel(r));
  }

  async createInvest(input: CreateInvestInput): Promise<InvestModel> {
    const id = await this.repos.investments.insertLocal(
      {
        name: input.name,
        amount: input.amount,
        note: input.note,
        startDate: input.startDate,
        endDate: null,
        status: EInvestStatus.Active,
        earned: 0,
      },
      { userId: input.userId },
    );
    const row = (await this.repos.investments.getById(id)) as LocalInvest;
    return this.toModel(row);
  }

  async updateInvest(
    localId: string,
    patch: {
      name?: string;
      amount?: number;
      note?: string;
      startDate?: string;
      endDate?: string | null;
      status?: EInvestStatus;
      earned?: number;
    },
  ): Promise<void> {
    const columns: Record<string, any> = {};
    if (patch.name !== undefined) columns.name = patch.name;
    if (patch.amount !== undefined) columns.amount = patch.amount;
    if (patch.note !== undefined) columns.note = patch.note;
    if (patch.startDate !== undefined) columns.startDate = patch.startDate;
    if (patch.endDate !== undefined) columns.endDate = patch.endDate;
    if (patch.status !== undefined) columns.status = patch.status;
    if (patch.earned !== undefined) columns.earned = patch.earned;
    await this.repos.investments.updateLocal(localId, columns);
  }

  async deleteInvest(localId: string): Promise<void> {
    await this.repos.investments.softDelete(localId);
  }
}
