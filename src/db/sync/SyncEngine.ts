import dayjs from "dayjs";
import type { IApiGateWay } from "@trackingPortal/api/interfaces";
import { getMonthTimestamp } from "@trackingPortal/utils/date";
import type { Repositories } from "@trackingPortal/db/repositories";
import type { Outbox } from "@trackingPortal/db/sync/Outbox";
import type { BaseRepository } from "@trackingPortal/db/repositories/BaseRepository";
import type { EntityName, OutboxItem } from "@trackingPortal/db/types";

/** How many months of transaction history to pull on sync. */
const TRANSACTION_HISTORY_MONTHS = 12;

export interface SyncResult {
  pushed: number;
  pushFailed: number;
  pulled: number;
}

export interface SyncProgress {
  step: string;
  progress: number; // 0–1
}

/**
 * Bridges the local SQLite store and the Railway REST API.
 *
 * - {@link push} drains the outbox, replaying queued creates/updates/deletes
 *   through the existing `apiGateway` services and reconciling server ids.
 * - {@link pull} re-fetches each entity per user and merges it into SQLite
 *   (newest-`updatedAt`-wins via the repositories), inferring remote deletes.
 *
 * NOTE (Phase 0): this engine is wired but **not auto-triggered** — the legacy
 * AsyncStorage queue still owns live writes. It is exposed for manual/dev
 * invocation; the Transactions slice will make it authoritative and connect it
 * to connectivity changes.
 */
export class SyncEngine {
  private inFlight: Promise<SyncResult> | null = null;

  constructor(
    private apiGateway: IApiGateWay,
    private repos: Repositories,
    private outbox: Outbox,
  ) {}

  /** Push then pull, guarded so only one full sync runs at a time. */
  async syncAll(
    userId: string,
    onProgress?: (p: SyncProgress) => void,
  ): Promise<SyncResult> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = (async () => {
      onProgress?.({ step: 'Preparing…', progress: 0 });
      const push = await this.push();
      const pulled = await this.pull(userId, onProgress);
      return { ...push, pulled };
    })();
    try {
      return await this.inFlight;
    } finally {
      this.inFlight = null;
    }
  }

  // ─── Push ──────────────────────────────────────────────────────────────────

  async push(): Promise<{ pushed: number; pushFailed: number }> {
    const items = await this.outbox.peekPending();
    let pushed = 0;
    let pushFailed = 0;

    for (const item of items) {
      try {
        await this.processOutboxItem(item);
        await this.outbox.markDone(item.id);
        pushed++;
      } catch (error: any) {
        await this.outbox.markFailed(item.id, String(error?.message ?? error));
        pushFailed++;
      }
    }

    return { pushed, pushFailed };
  }

  private repoFor(entity: EntityName): BaseRepository<any> {
    switch (entity) {
      case "transaction":
        return this.repos.transactions;
      case "category":
        return this.repos.categories;
      case "loan":
        return this.repos.loans;
      case "investment":
        return this.repos.investments;
      case "monthlyLimit":
        return this.repos.monthlyLimits;
      case "user":
        return this.repos.users;
    }
  }

  private async processOutboxItem(item: OutboxItem): Promise<void> {
    switch (item.entity) {
      case "transaction":
        return this.pushTransaction(item);
      case "category":
        return this.pushCategory(item);
      case "loan":
        return this.pushLoan(item);
      case "investment":
        return this.pushInvest(item);
      case "monthlyLimit":
        return this.pushMonthlyLimit(item);
      case "user":
        return this.pushUser(item);
    }
  }

  private async pushTransaction(item: OutboxItem): Promise<void> {
    const repo = this.repos.transactions;
    const local = await repo.getById(item.localId);
    if (!local) return; // already deleted locally

    if (item.op === "delete") {
      const serverId = await repo.serverIdForLocalId(item.localId);
      if (serverId) {
        await this.apiGateway.transactionService.deleteTransaction(
          serverId as any,
          local.type,
        );
      }
      await repo.purge(item.localId);
      return;
    }

    // Resolve a possibly-local categoryId to its server id before sending.
    const categoryServerId = local.categoryId
      ? (await this.repos.categories.serverIdForLocalId(local.categoryId)) ??
        local.categoryId
      : null;

    if (item.op === "create") {
      const result = await this.apiGateway.transactionService.addTransaction({
        userId: local.userId as any,
        amount: local.amount,
        description: local.description,
        date: local.date as any,
        categoryId: categoryServerId as any,
        type: local.type,
      });
      await repo.setServerId(item.localId, String((result as any).id), {
        createdAt: (result as any).created ?? null,
        updatedAt: (result as any).updated ?? null,
      });
      return;
    }

    // update
    const serverId = await repo.serverIdForLocalId(item.localId);
    if (!serverId) return;
    await this.apiGateway.transactionService.updateTransaction({
      id: serverId as any,
      amount: local.amount,
      description: local.description,
      date: local.date as any,
      categoryId: categoryServerId as any,
      type: local.type,
    });
    await repo.markSynced(item.localId);
  }

  private async pushCategory(item: OutboxItem): Promise<void> {
    const repo = this.repos.categories;
    const local = await repo.getById(item.localId);
    if (!local) return;
    const svc = this.apiGateway.categoryService;
    const isIncome = local.kind === "income";

    if (item.op === "delete") {
      const serverId = await repo.serverIdForLocalId(item.localId);
      if (serverId) {
        if (isIncome) {
          await svc.deleteIncomeCategory(serverId, local.userId as any);
        } else {
          await svc.deleteExpenseCategory(serverId, local.userId as any);
        }
      }
      await repo.purge(item.localId);
      return;
    }

    const params = {
      name: local.name,
      icon: local.icon ?? "",
      color: local.color ?? "",
      userId: local.userId as any,
    };

    if (item.op === "create") {
      const result = isIncome
        ? await svc.createIncomeCategory(params)
        : await svc.createExpenseCategory(params);
      await repo.setServerId(item.localId, String((result as any).id));
      return;
    }

    const serverId = await repo.serverIdForLocalId(item.localId);
    if (!serverId) return;
    if (isIncome) {
      await svc.updateIncomeCategory(serverId, params);
    } else {
      await svc.updateExpenseCategory(serverId, params);
    }
    await repo.markSynced(item.localId);
  }

  private async pushLoan(item: OutboxItem): Promise<void> {
    const repo = this.repos.loans;
    const local = await repo.getById(item.localId);
    if (!local) return;

    if (item.op === "delete") {
      const serverId = await repo.serverIdForLocalId(item.localId);
      if (serverId) await this.apiGateway.loanServices.deleteLoan(serverId as any);
      await repo.purge(item.localId);
      return;
    }

    if (item.op === "create") {
      const result = await this.apiGateway.loanServices.addLoan({
        userId: local.userId as any,
        name: local.name,
        amount: local.amount,
        note: local.note,
        deadLine: local.deadLine as any,
        loanType: local.loanType as any,
      });
      await repo.setServerId(item.localId, String((result as any).id), {
        createdAt: (result as any).created ?? null,
        updatedAt: (result as any).updated ?? null,
      });
      return;
    }

    const serverId = await repo.serverIdForLocalId(item.localId);
    if (!serverId) return;
    await this.apiGateway.loanServices.updateLoan({
      id: serverId as any,
      name: local.name,
      amount: local.amount,
      note: local.note,
      deadLine: local.deadLine as any,
    });
    await repo.markSynced(item.localId);
  }

  private async pushInvest(item: OutboxItem): Promise<void> {
    const repo = this.repos.investments;
    const local = await repo.getById(item.localId);
    if (!local) return;

    if (item.op === "delete") {
      const serverId = await repo.serverIdForLocalId(item.localId);
      if (serverId) await this.apiGateway.investService.deleteInvest(serverId as any);
      await repo.purge(item.localId);
      return;
    }

    if (item.op === "create") {
      const result = await this.apiGateway.investService.addInvest({
        userId: local.userId as any,
        name: local.name,
        amount: local.amount,
        note: local.note ?? "",
        startDate: local.startDate as any,
        endDate: (local.endDate ?? undefined) as any,
      });
      await repo.setServerId(item.localId, String((result as any).id), {
        createdAt: (result as any).created ?? null,
        updatedAt: (result as any).updated ?? null,
      });
      return;
    }

    const serverId = await repo.serverIdForLocalId(item.localId);
    if (!serverId) return;
    await this.apiGateway.investService.updateInvest({
      id: serverId as any,
      name: local.name,
      amount: local.amount,
      note: local.note ?? "",
      startDate: local.startDate as any,
      endDate: (local.endDate ?? undefined) as any,
      status: (local.status ?? undefined) as any,
      earned: (local.earned ?? undefined) as any,
    });
    await repo.markSynced(item.localId);
  }

  private async pushMonthlyLimit(item: OutboxItem): Promise<void> {
    const repo = this.repos.monthlyLimits;
    const local = await repo.getById(item.localId);
    if (!local) return;
    const svc = this.apiGateway.monthlyLimitService;

    if (item.op === "create") {
      const result = await svc.addMonthlyLimit({
        userId: local.userId as any,
        month: local.month as any,
        year: local.year as any,
        limit: local.limit as any,
      });
      await repo.setServerId(item.localId, String((result as any).id));
      return;
    }
    if (item.op === "update") {
      const serverId = await repo.serverIdForLocalId(item.localId);
      if (!serverId) return;
      await svc.updateMonthlyLimit({
        id: serverId as any,
        limit: local.limit as any,
      } as any);
      await repo.markSynced(item.localId);
    }
  }

  private async pushUser(item: OutboxItem): Promise<void> {
    const repo = this.repos.users;
    const local = await repo.getById(item.localId);
    if (!local || item.op === "delete") return;
    await this.apiGateway.userService.updateUser({
      userId: local.serverId as any,
      name: local.name ?? undefined,
    } as any);
    await repo.markSynced(item.localId);
  }

  // ─── Pull ────────────────────────────────────────────────────────────────

  /**
   * Full re-fetch of each entity for the user, merged into SQLite. Returns the
   * number of server records reconciled. Remote deletes are inferred by diffing
   * the server ids against locally-synced rows within the fetched scope.
   */
  async pull(
    userId: string,
    onProgress?: (p: SyncProgress) => void,
  ): Promise<number> {
    let count = 0;
    const steps: { label: string; fn: () => Promise<number> }[] = [
      { label: 'Syncing expenses', fn: () => this.pullTransactions(userId, 'expense') },
      { label: 'Syncing income', fn: () => this.pullTransactions(userId, 'income') },
      { label: 'Syncing expense categories', fn: () => this.pullCategories(userId, 'expense') },
      { label: 'Syncing income categories', fn: () => this.pullCategories(userId, 'income') },
      { label: 'Syncing loans', fn: () => this.pullLoans(userId) },
      { label: 'Syncing investments', fn: () => this.pullInvestments(userId) },
      { label: 'Syncing monthly limits', fn: () => this.pullMonthlyLimits(userId) },
    ];
    for (let i = 0; i < steps.length; i++) {
      const { label, fn } = steps[i];
      onProgress?.({ step: label, progress: i / steps.length });
      try {
        count += await fn();
      } catch (error) {
        console.log('pull step failed', label, error);
      }
    }
    onProgress?.({ step: 'Finalizing…', progress: 1 });
    return count;
  }

  private async pullTransactions(
    userId: string,
    type: "expense" | "income",
  ): Promise<number> {
    // The list endpoint requires a `date` and returns a single month, so walk
    // back over a window of months to build local history. Each month is
    // isolated so one bad response doesn't drop the rest.
    let total = 0;
    const now = dayjs();
    for (let i = 0; i < TRANSACTION_HISTORY_MONTHS; i++) {
      const month = now.subtract(i, "month");
      const date = getMonthTimestamp(month.year(), month.month());
      try {
        const list = await this.apiGateway.transactionService.getTransactionsByUser({
          userId: userId as any,
          type,
          date,
        } as any);
        for (const model of list) {
          await this.repos.transactions.upsertFromServer({ ...model, type });
        }
        total += list.length;
      } catch (error) {
        console.log("pull transactions month failed", type, String(date), error);
      }
    }
    // NOTE: remote-delete inference is intentionally NOT applied to transactions
    // (per-month scope makes a full-set diff unsafe). Loans/investments below
    // use full-list endpoints and still reconcile deletes safely.
    return total;
  }

  private async pullCategories(
    userId: string,
    kind: "expense" | "income",
  ): Promise<number> {
    const list =
      kind === "income"
        ? await this.apiGateway.categoryService.getIncomeCategories(userId as any)
        : await this.apiGateway.categoryService.getExpenseCategories(userId as any);
    for (const model of list) {
      await this.repos.categories.upsertFromServer({ ...model, kind });
    }
    return list.length;
  }

  private async pullLoans(userId: string): Promise<number> {
    const list = await this.apiGateway.loanServices.getLoanByUserId(userId as any);
    for (const model of list) {
      await this.repos.loans.upsertFromServer({ ...model, userId });
    }
    await this.repos.loans.backfillUserId(userId);
    await this.reconcileDeletes(
      this.repos.loans,
      list.map((m: any) => String(m.id)),
      "userId = ?",
      [userId],
    );
    return list.length;
  }

  private async pullInvestments(userId: string): Promise<number> {
    // The invest list endpoint filters by status, so fetch both to mirror the
    // full set the app shows (Active + Completed).
    const all: any[] = [];
    for (const status of [1, 2]) {
      const list = await this.apiGateway.investService.getInvestByUserId({
        userId: userId as any,
        status: status as any,
      } as any);
      for (const model of list) {
        await this.repos.investments.upsertFromServer({ ...model, userId });
      }
      all.push(...list);
    }
    await this.repos.investments.backfillUserId(userId);
    await this.reconcileDeletes(
      this.repos.investments,
      all.map((m: any) => String(m.id)),
      "userId = ?",
      [userId],
    );
    return all.length;
  }

  private async pullMonthlyLimits(userId: string): Promise<number> {
    // The limit endpoint is keyed by (month, year), so walk the same history
    // window and fetch each month's limit individually.
    let total = 0;
    const now = dayjs();
    const localRows = (await this.repos.monthlyLimits.getByUser(userId)) as any[];
    for (let i = 0; i < TRANSACTION_HISTORY_MONTHS; i++) {
      const m = now.subtract(i, "month");
      const month = m.month() + 1;
      const year = m.year();
      try {
        const res: any = await this.apiGateway.monthlyLimitService.getMonthlyLimitByUserId({
          userId: userId as any,
          month: month as any,
          year: year as any,
        });
        if (!res?.id) continue; // no limit set for this month
        // Keep a pending local edit for this period (local wins until pushed).
        const existing = localRows.find((r) => r.month === month && r.year === year);
        if (existing && existing.syncStatus === "pending") continue;
        await this.repos.monthlyLimits.upsertFromServer({ ...res, userId });
        total += 1;
      } catch (error) {
        console.log("pull monthly limit failed", month, year, error);
      }
    }
    await this.repos.monthlyLimits.backfillUserId(userId);
    return total;
  }

  /**
   * Soft-removes locally-synced rows whose serverId is absent from the latest
   * server list (i.e. deleted on another device). Pending local rows are left
   * untouched so unsynced work is never lost.
   */
  private async reconcileDeletes(
    repo: BaseRepository<any>,
    serverIds: string[],
    where: string,
    params: any[],
  ): Promise<void> {
    const known = await repo.knownServerIds(`${where} AND syncStatus = 'synced'`, params);
    const present = new Set(serverIds);
    for (const serverId of known) {
      if (!present.has(serverId)) {
        await repo.markRemotelyDeleted(serverId);
      }
    }
  }
}
