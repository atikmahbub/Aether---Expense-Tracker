import dayjs, { Dayjs } from "dayjs";

import type {
  TransactionModel,
  TransactionSummaryModel,
  TransactionAnalyticsModel,
} from "@trackingPortal/api/models";
import { makeUnixTimestampString } from "@trackingPortal/api/primitives";
import { parseDate } from "@trackingPortal/utils/date";
import type { Repositories } from "@trackingPortal/db/repositories";
import type { LocalCategory } from "@trackingPortal/db/repositories/CategoryRepository";
import type { LocalTransaction } from "@trackingPortal/db/repositories/TransactionRepository";
import type { SyncEngine } from "@trackingPortal/db/sync/SyncEngine";

/** A transaction as the screens consume it, plus the local `categoryId`. */
export type UITransaction = TransactionModel & { categoryId: string | null };

export interface CreateTransactionInput {
  userId: string;
  amount: number;
  description: string | null;
  date: string; // UnixTimeStampString
  categoryId: string | null;
  type: "expense" | "income";
}

const round = (n: number) => Math.round(n);

const pctChange = (current: number, previous: number): number => {
  if (previous <= 0) return 0;
  return round(((current - previous) / previous) * 100);
};

/**
 * SQLite-backed read/write API for transactions — the offline-first replacement
 * for the transaction read endpoints. Screens read exclusively through this
 * (never the network), and writes go to SQLite + the outbox. Summary and
 * analytics are computed locally from stored rows so they work offline.
 */
export class TransactionDataService {
  constructor(
    private repos: Repositories,
    private syncEngine: SyncEngine,
  ) {}

  // ─── Category resolution ───────────────────────────────────────────────────

  /**
   * Builds a lookup that resolves a transaction's `categoryId` to its category,
   * keyed by both the local id and the serverId — pulled transactions reference
   * the server category id, while offline-created ones reference the local id.
   */
  private async categoryLookup(): Promise<Record<string, LocalCategory>> {
    const all = await this.repos.categories.getAll();
    const lookup: Record<string, LocalCategory> = {};
    for (const c of all) {
      lookup[c.id] = c;
      if (c.serverId) lookup[c.serverId] = c;
    }
    return lookup;
  }

  private toUITransaction(
    row: LocalTransaction,
    lookup: Record<string, LocalCategory>,
  ): UITransaction {
    const category = row.categoryId ? lookup[row.categoryId] : undefined;
    return {
      id: row.id,
      type: row.type,
      amount: row.amount,
      description: row.description ?? "",
      date: row.date ?? "",
      categoryId: category?.id ?? row.categoryId ?? null,
      category: {
        name: category?.name ?? "Other",
        icon: category?.icon ?? "receipt",
        color: category?.color ?? "#9AA0A6",
      },
    };
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  /** All non-deleted transactions for the user in the given month (both types). */
  async getMonthTransactions(
    userId: string,
    month: Dayjs,
  ): Promise<UITransaction[]> {
    const rows = (await this.repos.transactions.getAll("userId = ?", [
      userId,
    ])) as LocalTransaction[];
    const lookup = await this.categoryLookup();
    const target = dayjs(month).format("YYYY-MM");

    return rows
      .filter((r) => r.date && dayjs(parseDate(r.date)).format("YYYY-MM") === target)
      .sort((a, b) => Number(parseDate(b.date)) - Number(parseDate(a.date)))
      .map((r) => this.toUITransaction(r, lookup));
  }

  private async monthTotals(userId: string, month: Dayjs) {
    const rows = (await this.repos.transactions.getAll("userId = ?", [
      userId,
    ])) as LocalTransaction[];
    const target = dayjs(month).format("YYYY-MM");
    let totalExpense = 0;
    let totalIncome = 0;
    for (const r of rows) {
      if (!r.date || dayjs(parseDate(r.date)).format("YYYY-MM") !== target) continue;
      if (r.type === "income") totalIncome += r.amount;
      else totalExpense += r.amount;
    }
    return { totalExpense, totalIncome };
  }

  /** Totals for the month plus month-over-month change percentages. */
  async getSummary(userId: string, month: Dayjs): Promise<TransactionSummaryModel> {
    const current = await this.monthTotals(userId, month);
    const previous = await this.monthTotals(userId, dayjs(month).subtract(1, "month"));
    return {
      totalExpense: current.totalExpense,
      totalIncome: current.totalIncome,
      expenseChangePercentage: pctChange(current.totalExpense, previous.totalExpense),
      incomeChangePercentage: pctChange(current.totalIncome, previous.totalIncome),
    };
  }

  /** Category breakdown for one type in the given month. */
  async getAnalytics(
    userId: string,
    month: Dayjs,
    type: "expense" | "income",
  ): Promise<TransactionAnalyticsModel> {
    const rows = (await this.repos.transactions.getAll("userId = ? AND type = ?", [
      userId,
      type,
    ])) as LocalTransaction[];
    const lookup = await this.categoryLookup();
    const target = dayjs(month).format("YYYY-MM");

    const totals = new Map<string, { name: string; amount: number }>();
    let grandTotal = 0;
    let count = 0;

    for (const r of rows) {
      if (!r.date || dayjs(parseDate(r.date)).format("YYYY-MM") !== target) continue;
      count += 1;
      grandTotal += r.amount;
      const category = r.categoryId ? lookup[r.categoryId] : undefined;
      const key = category?.id ?? r.categoryId ?? "uncategorized";
      const name = category?.name ?? "Other";
      const prev = totals.get(key);
      totals.set(key, { name, amount: (prev?.amount ?? 0) + r.amount });
    }

    const categoryBreakdown = Array.from(totals.entries())
      .map(([categoryId, { name, amount }]) => ({
        categoryId,
        categoryName: name,
        totalAmount: amount,
        percentage: grandTotal > 0 ? round((amount / grandTotal) * 100) : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    const top = categoryBreakdown[0];
    return {
      totalTransaction: count,
      categoryBreakdown,
      topCategory: top
        ? {
            categoryId: top.categoryId,
            categoryName: top.categoryName,
            totalAmount: top.totalAmount,
          }
        : null,
    };
  }

  // ─── Writes (SQLite + outbox) ──────────────────────────────────────────────

  /** Creates a transaction locally (pending) and returns it for optimistic UI. */
  async createTransaction(input: CreateTransactionInput): Promise<UITransaction> {
    const id = await this.repos.transactions.insertLocal(
      {
        type: input.type,
        amount: input.amount,
        description: input.description,
        date: input.date,
        categoryId: input.categoryId,
      },
      { userId: input.userId },
    );
    const row = await this.repos.transactions.getById(id);
    const lookup = await this.categoryLookup();
    return this.toUITransaction(row as LocalTransaction, lookup);
  }

  /** Applies a local edit (pending) to an existing transaction. */
  async updateTransaction(
    localId: string,
    patch: {
      amount?: number;
      description?: string | null;
      date?: string;
      categoryId?: string | null;
    },
  ): Promise<void> {
    const columns: Record<string, any> = {};
    if (patch.amount !== undefined) columns.amount = patch.amount;
    if (patch.description !== undefined) columns.description = patch.description;
    if (patch.date !== undefined) columns.date = patch.date;
    if (patch.categoryId !== undefined) columns.categoryId = patch.categoryId;
    await this.repos.transactions.updateLocal(localId, columns);
  }

  /** Soft-deletes a transaction locally and queues the remote delete. */
  async deleteTransaction(localId: string): Promise<void> {
    await this.repos.transactions.softDelete(localId);
  }

  /** Normalizes a JS Date to the midday UnixTimeStampString the app stores. */
  static toTimestamp(date: Date): string {
    const safe = dayjs(date).hour(12).minute(0).second(0).millisecond(0).toDate();
    return makeUnixTimestampString(Number(safe)) as unknown as string;
  }
}
