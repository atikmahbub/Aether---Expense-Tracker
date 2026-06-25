import type { MonthlyLimitModel } from "@trackingPortal/api/models";
import { makeUnixTimestampString } from "@trackingPortal/api/primitives";
import type { Repositories } from "@trackingPortal/db/repositories";
import type { LocalMonthlyLimit } from "@trackingPortal/db/repositories/MonthlyLimitRepository";

/**
 * SQLite-backed read/write API for the monthly spending limit. Keyed by
 * (userId, month, year) — there is at most one limit per month. Reads come from
 * SQLite so the limit shows offline; writes go to SQLite + the outbox.
 */
export class MonthlyLimitDataService {
  constructor(private repos: Repositories) {}

  private toModel(row: LocalMonthlyLimit): MonthlyLimitModel {
    return {
      id: row.id as any,
      userId: (row.userId ?? "") as any,
      month: row.month as any,
      year: row.year as any,
      limit: row.limit ?? 0,
      created: (row.createdAt ?? makeUnixTimestampString(0)) as any,
      updated: (row.updatedAt ?? makeUnixTimestampString(0)) as any,
    } as MonthlyLimitModel;
  }

  private async findRow(
    userId: string,
    month: number,
    year: number,
  ): Promise<LocalMonthlyLimit | null> {
    const rows = (await this.repos.monthlyLimits.getByUser(
      userId,
    )) as LocalMonthlyLimit[];
    return rows.find((r) => r.month === month && r.year === year) ?? null;
  }

  /** The limit for a given month, or an empty model when none is set. */
  async getLimit(
    userId: string,
    month: number,
    year: number,
  ): Promise<MonthlyLimitModel> {
    const row = await this.findRow(userId, month, year);
    return row ? this.toModel(row) : ({} as MonthlyLimitModel);
  }

  /** Creates or updates the limit for a month (SQLite + outbox). */
  async setLimit(
    userId: string,
    month: number,
    year: number,
    limit: number,
  ): Promise<void> {
    const existing = await this.findRow(userId, month, year);
    if (existing) {
      await this.repos.monthlyLimits.updateLocal(existing.id, { limit });
    } else {
      await this.repos.monthlyLimits.insertLocal({ month, year, limit }, { userId });
    }
  }
}
