/**
 * Remaining balance and carry over, worked out from per-month totals.
 *
 * Carry over is never stored: each month's is the previous month's remaining,
 * chained back to the user's first month with data, so editing or deleting an
 * old entry fixes every month after it. Months follow Asia/Dhaka local time.
 *
 * Kept free of React, dayjs and the database so it can be unit tested.
 */

/** Asia/Dhaka is UTC+6 all year (no daylight saving). */
export const DHAKA_OFFSET_SECONDS = 6 * 60 * 60;

/** "YYYY-MM". */
export type MonthKey = string;

export type MonthTotals = { income: number; spent: number };
export type MonthlyTotals = Record<MonthKey, MonthTotals>;

export type MonthBalance = {
  month: MonthKey;
  carryOver: number;
  income: number;
  spent: number;
  /** carryOver + income */
  available: number;
  /** available − spent */
  remaining: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Dhaka month of a millisecond timestamp. */
export const dhakaMonthKey = (ms: number): MonthKey => {
  const d = new Date(ms + DHAKA_OFFSET_SECONDS * 1000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
};

/** Day of the month (1-based) in Dhaka for a millisecond timestamp. */
export const dhakaDayOfMonth = (ms: number): number =>
  new Date(ms + DHAKA_OFFSET_SECONDS * 1000).getUTCDate();

export const shiftMonth = (month: MonthKey, by: number): MonthKey => {
  const [y, m] = month.split("-").map(Number);
  const index = y * 12 + (m - 1) + by;
  return `${Math.floor(index / 12)}-${pad((index % 12) + 1)}`;
};

export const daysInMonth = (month: MonthKey): number => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

const EMPTY: MonthTotals = { income: 0, spent: 0 };

/**
 * Balance for `month` and the month before it. With carry over off, every
 * month's carry over is 0.
 */
export function monthBalances(
  totals: MonthlyTotals,
  month: MonthKey,
  carryOverEnabled: boolean,
): { current: MonthBalance; previous: MonthBalance } {
  const balance = (key: MonthKey, carryOver: number): MonthBalance => {
    const { income, spent } = totals[key] ?? EMPTY;
    const available = carryOver + income;
    return { month: key, carryOver, income, spent, available, remaining: available - spent };
  };
  const previousKey = shiftMonth(month, -1);

  // Keys are zero-padded, so string order is month order.
  const first = Object.keys(totals).sort()[0];
  if (!carryOverEnabled || !first || first >= month) {
    return { current: balance(month, 0), previous: balance(previousKey, 0) };
  }

  let previous = balance(first, 0);
  while (previous.month < previousKey) {
    previous = balance(shiftMonth(previous.month, 1), previous.remaining);
  }
  return { current: balance(month, previous.remaining), previous };
}

export type DayStats = {
  /** spent ÷ days passed (today included). */
  dailyAvg: number;
  /**
   * min(limit left, remaining) ÷ days left (today included). Null outside the
   * current month, where it has no meaning. Zero or below means nothing left.
   */
  safePerDay: number | null;
};

export function dayStats({
  month,
  now,
  spent,
  remaining,
  limit,
}: {
  month: MonthKey;
  /** Milliseconds. */
  now: number;
  spent: number;
  remaining: number;
  /** 0 when no limit is set. */
  limit: number;
}): DayStats {
  const today = dhakaMonthKey(now);
  const total = daysInMonth(month);

  if (month !== today) {
    // Past months average over the whole month; future months have no days yet.
    return { dailyAvg: month < today ? spent / total : 0, safePerDay: null };
  }

  const day = dhakaDayOfMonth(now);
  const daysLeft = total - day + 1;
  const limitLeft = limit > 0 ? limit - spent : Infinity;
  return {
    dailyAvg: spent / day,
    safePerDay: Math.min(limitLeft, remaining) / daysLeft,
  };
}

/** Share of income not spent, as a whole percent (never below 0). */
export const keptPercent = (income: number, spent: number): number =>
  income > 0 ? Math.max(Math.round(((income - spent) / income) * 100), 0) : 0;
