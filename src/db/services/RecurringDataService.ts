import dayjs, { Dayjs } from "dayjs";

import type { RecurringFrequency } from "@trackingPortal/api/models/RecurringRuleModel";
import { parseDate } from "@trackingPortal/utils/date";
import type { Repositories } from "@trackingPortal/db/repositories";
import type { LocalRecurringRule } from "@trackingPortal/db/repositories/RecurringRuleRepository";
import type { LocalTransaction } from "@trackingPortal/db/repositories/TransactionRepository";

/** Most entries one run may add per rule, so a long-closed app can't flood the list. */
const MAX_CATCH_UP = 12;

/** A rule as the recurring screens consume it. */
export interface RecurringRuleView extends LocalRecurringRule {
  paused: boolean;
  /** True once the end date has passed every remaining occurrence. */
  ended: boolean;
  /** Next occurrence still to be added, or null when paused/ended. */
  nextDate: Date | null;
}

export interface CreateRecurringRuleInput {
  userId: string;
  type: "expense" | "income";
  amount: number;
  description: string | null;
  categoryId: string | null;
  frequency: RecurringFrequency;
  startDate: string; // seconds UnixTimeStampString
  endDate: string | null;
}

const toSeconds = (d: Dayjs) => String(Math.floor(d.valueOf() / 1000));

/** 1st, 2nd, 3rd, 11th, 22nd… */
export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

/**
 * The nth occurrence of a rule, always counted from the start date rather than
 * from the previous occurrence, so a rule on the 31st comes back to the 31st
 * after a short month (dayjs clamps 31 Jan + 1 month to 28/29 Feb).
 */
export function occurrenceAt(
  start: Dayjs,
  frequency: RecurringFrequency,
  n: number,
): Dayjs {
  if (frequency === "weekly") return start.add(n * 7, "day");
  if (frequency === "yearly") return start.add(n, "year");
  return start.add(n, "month");
}

/** "Monthly on the 1st", "Weekly on Saturday", "Yearly on 31 Oct". */
export function describeFrequency(
  frequency: RecurringFrequency,
  start: Date,
): string {
  const d = dayjs(start);
  if (frequency === "weekly") return `Weekly on ${d.format("dddd")}`;
  if (frequency === "yearly") return `Yearly on ${d.format("D MMM")}`;
  return `Monthly on the ${ordinal(d.date())}`;
}

export const FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

/** A monthly rule past the 28th lands on the last day of shorter months. */
export const clampsInShortMonths = (frequency: RecurringFrequency, start: Date) =>
  frequency === "monthly" && dayjs(start).date() > 28;

/** What a rule costs or brings in per month, for the list summary. */
export function monthlyEquivalent(rule: { amount: number; frequency: RecurringFrequency }) {
  if (rule.frequency === "weekly") return (rule.amount * 52) / 12;
  if (rule.frequency === "yearly") return rule.amount / 12;
  return rule.amount;
}

/**
 * SQLite-backed recurring rules, plus the catch-up run that turns due
 * occurrences into ordinary transactions. Everything is decided on the device,
 * so it works offline; `lastRunDate` on the rule is the cursor that keeps a
 * run from adding the same occurrence twice.
 */
export class RecurringDataService {
  private running: Promise<number> | null = null;

  constructor(private repos: Repositories) {}

  private firstAfter(rule: LocalRecurringRule, after: Dayjs | null): Dayjs | null {
    const start = dayjs(parseDate(rule.startDate));
    const end = rule.endDate ? dayjs(parseDate(rule.endDate)).endOf("day") : null;
    for (let n = 0; ; n++) {
      const occ = occurrenceAt(start, rule.frequency, n);
      if (end && occ.isAfter(end)) return null;
      if (!after || occ.isAfter(after)) return occ;
    }
  }

  private toView(rule: LocalRecurringRule): RecurringRuleView {
    const cursor = rule.lastRunDate ? dayjs(parseDate(rule.lastRunDate)) : null;
    const next = this.firstAfter(rule, cursor);
    const paused = Boolean(rule.pausedAt);
    return {
      ...rule,
      paused,
      ended: next === null,
      nextDate: paused || !next ? null : next.toDate(),
    };
  }

  async getRules(userId: string): Promise<RecurringRuleView[]> {
    const rows = await this.repos.recurringRules.getByUser(userId);
    return rows
      .map((r) => this.toView(r))
      .sort((a, b) => b.amount - a.amount);
  }

  /** Entries a rule has generated, newest first. */
  async getEntries(ruleId: string, limit = 5): Promise<LocalTransaction[]> {
    // Entries made here hold the local rule id; pulled ones hold the server id.
    const serverId = await this.repos.recurringRules.serverIdForLocalId(ruleId);
    const rows = (await this.repos.transactions.getAll(
      "recurringRuleId IN (?, ?)",
      [ruleId, serverId ?? ruleId],
    )) as LocalTransaction[];
    return rows
      .sort((a, b) => Number(parseDate(b.date)) - Number(parseDate(a.date)))
      .slice(0, limit);
  }

  async createRule(input: CreateRecurringRuleInput): Promise<string> {
    return this.repos.recurringRules.insertLocal(
      {
        type: input.type,
        amount: input.amount,
        description: input.description,
        categoryId: input.categoryId,
        frequency: input.frequency,
        startDate: input.startDate,
        endDate: input.endDate,
        pausedAt: null,
        lastRunDate: null,
      },
      { userId: input.userId },
    );
  }

  /**
   * Amount, note and category only; the schedule is fixed (delete and re-add
   * to move it), which keeps the cursor from ever re-adding an occurrence.
   * Changes apply to future entries; generated ones are left as they are.
   */
  async updateRule(
    localId: string,
    patch: { amount?: number; description?: string | null; categoryId?: string | null },
  ): Promise<void> {
    const columns: Record<string, any> = {};
    if (patch.categoryId !== undefined) columns.categoryId = patch.categoryId;
    if (patch.amount !== undefined) columns.amount = patch.amount;
    if (patch.description !== undefined) columns.description = patch.description;
    await this.repos.recurringRules.updateLocal(localId, columns);
  }

  async pauseRule(localId: string): Promise<void> {
    await this.repos.recurringRules.updateLocal(localId, {
      pausedAt: toSeconds(dayjs()),
    });
  }

  /**
   * Resumes from today: occurrences that fell while paused are skipped, not
   * back-filled, by moving the cursor up to the latest one already past.
   */
  async resumeRule(localId: string): Promise<void> {
    const rule = await this.repos.recurringRules.getById(localId);
    if (!rule) return;
    // Today's occurrence is still added on resume, like any due entry.
    const today = dayjs().startOf("day");
    const cursor = rule.lastRunDate ? dayjs(parseDate(rule.lastRunDate)) : null;
    let skipTo: Dayjs | null = null;
    let occ = this.firstAfter(rule, cursor);
    while (occ && occ.isBefore(today)) {
      skipTo = occ;
      occ = this.firstAfter(rule, occ);
    }
    await this.repos.recurringRules.updateLocal(localId, {
      pausedAt: null,
      ...(skipTo ? { lastRunDate: toSeconds(skipTo) } : {}),
    });
  }

  /** Stops the rule; entries it already added stay in the history. */
  async deleteRule(localId: string): Promise<void> {
    await this.repos.recurringRules.softDelete(localId);
  }

  /**
   * Adds every due occurrence of every active rule as a transaction and
   * advances each rule's cursor. Returns how many entries were added.
   * Concurrent callers share one run.
   */
  runDue(userId: string): Promise<number> {
    if (!this.running) {
      this.running = this.generate(userId).finally(() => {
        this.running = null;
      });
    }
    return this.running;
  }

  private async generate(userId: string): Promise<number> {
    const rules = await this.repos.recurringRules.getByUser(userId);
    const today = dayjs().endOf("day");
    let added = 0;

    for (const rule of rules) {
      if (rule.pausedAt) continue;
      const due: Dayjs[] = [];
      let occ = this.firstAfter(
        rule,
        rule.lastRunDate ? dayjs(parseDate(rule.lastRunDate)) : null,
      );
      while (occ && !occ.isAfter(today)) {
        due.push(occ);
        occ = this.firstAfter(rule, occ);
      }
      if (!due.length) continue;

      for (const when of due.slice(-MAX_CATCH_UP)) {
        await this.repos.transactions.insertLocal(
          {
            type: rule.type,
            amount: rule.amount,
            description: rule.description,
            date: toSeconds(when),
            categoryId: rule.categoryId,
            recurringRuleId: rule.id,
            occurrenceDate: toSeconds(when),
          },
          { userId },
        );
        added++;
      }
      await this.repos.recurringRules.updateLocal(rule.id, {
        lastRunDate: toSeconds(due[due.length - 1]),
      });
    }
    return added;
  }
}
